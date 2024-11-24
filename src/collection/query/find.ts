import type {
  Filter,
  FindOptions,
  Collection as MongoCollection,
  Sort as MongoSort,
} from "mongodb";
import { MonarchRelation } from "../../schema/relations/base";
import type {
  InferRelationObjectPopulation,
  RelationPopulationOptions,
  RelationType,
  SchemaRelationPopulation,
} from "../../schema/relations/type-helpers";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOmit,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { Merge, Pretty, TrueKeys } from "../../type-helpers";
import { mapOneOrArray } from "../../utils";
import type { PipelineStage } from "../types/pipeline-stage";
import type {
  BoolProjection,
  Projection,
  Sort,
  WithProjection,
} from "../types/query-options";
import {
  addPipelineMetas,
  addPopulationPipeline,
  getSortDirection,
} from "../utils/population";
import {
  addExtraInputsToProjection,
  makePopulationProjection,
  makeProjection,
} from "../utils/projection";
import { Query } from "./base";

export class FindQuery<
  T extends AnySchema,
  O = InferSchemaOutput<T>,
  P extends ["omit" | "select", keyof any] = ["omit", InferSchemaOmit<T>],
> extends Query<T, WithProjection<P[0], P[1], O>[]> {
  private _projection: Projection<InferSchemaOutput<T>>;
  private _population: SchemaRelationPopulation<T> = {};

  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _options: FindOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
    this._projection = makeProjection("omit", _schema.options.omit ?? {});
  }

  public options(options: FindOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public sort(sort: Sort<InferSchemaOutput<T>>): this {
    this._options.sort = sort as MongoSort;
    return this;
  }

  public limit(limit: number): this {
    this._options.limit = limit;
    return this;
  }

  public skip(skip: number): this {
    this._options.skip = skip;
    return this;
  }

  public omit<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("omit", projection);
    return this as FindQuery<T, O, ["omit", TrueKeys<P>]>;
  }

  public select<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("select", projection);
    return this as FindQuery<T, O, ["select", TrueKeys<P>]>;
  }

  public populate<P extends SchemaRelationPopulation<T>>(population: P) {
    Object.assign(this._population, population);
    return this as FindQuery<
      T,
      Pretty<Merge<O, InferRelationObjectPopulation<T, P>>>
    >;
  }

  public async exec(): Promise<WithProjection<P[0], P[1], O>[]> {
    await this._readyPromise;
    if (Object.keys(this._population).length) {
      return this._execWithPopulate();
    }
    return this._execWithoutPopulate();
  }

  private async _execWithoutPopulate(): Promise<
    WithProjection<P[0], P[1], O>[]
  > {
    const extra = addExtraInputsToProjection(
      this._projection,
      this._schema.options.virtuals,
    );
    const res = await this._collection
      .find(this._filter, { ...this._options, projection: this._projection })
      .map(
        (doc) =>
          Schema.fromData(
            this._schema,
            doc as InferSchemaData<T>,
            this._projection,
            extra,
          ) as O,
      )
      .toArray();
    return res;
  }

  private async _execWithPopulate(): Promise<WithProjection<P[0], P[1], O>[]> {
    const pipeline: PipelineStage<InferSchemaOutput<T>>[] = [
      // @ts-ignore
      { $match: this._filter },
    ];
    const extra = addExtraInputsToProjection(
      this._projection,
      this._schema.options.virtuals,
    );
    if (Object.keys(this._projection).length) {
      // @ts-ignore
      pipeline.push({ $project: this._projection });
    }

    const relations = Schema.relations(this._schema);
    const populations: Record<
      string,
      {
        relation: RelationType;
        fieldVariable: string;
        projection: Projection<any>;
        extra: string[] | null;
      }
    > = {};
    for (const [field, options] of Object.entries(this._population)) {
      if (!options) continue;
      const relation = MonarchRelation.getRelation(
        relations[field],
      ) as RelationType;
      const _options =
        options === true ? {} : (options as RelationPopulationOptions<any>);
      // get population projection or fallback to schema omit projection
      const projection =
        makePopulationProjection(_options) ??
        makeProjection("omit", relation._target.options.omit ?? {});
      const extra = addExtraInputsToProjection(
        projection,
        relation._target.options.virtuals,
      );
      const { fieldVariable } = addPopulationPipeline(
        pipeline,
        field,
        relation,
        projection,
        _options,
      );
      populations[field] = { relation, fieldVariable, projection, extra };
    }

    addPipelineMetas(pipeline, {
      limit: this._options.limit,
      skip: this._options.skip,
      sort: getSortDirection(this._options.sort),
    });

    const res = await this._collection
      .aggregate(pipeline)
      .map((doc) => {
        console.log(doc);
        const populatedDoc = Schema.fromData(
          this._schema,
          doc as InferSchemaData<T>,
          this._projection,
          extra,
        );
        for (const [key, population] of Object.entries(populations)) {
          //@ts-ignore
          populatedDoc[key] = mapOneOrArray(
            doc[population.fieldVariable],
            (doc) => {
              return Schema.fromData(
                population.relation._target,
                doc,
                population.projection,
                population.extra,
              );
            },
          );
        }
        return populatedDoc as O;
      })
      .toArray();
    return res;
  }
}
