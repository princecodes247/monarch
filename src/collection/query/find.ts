import type {
  Filter,
  FindOptions,
  Collection as MongoCollection,
  Sort as MongoSort,
} from "mongodb";
import type {
  InferRelationPopulationObject,
  SchemaRelationSelect,
} from "../../schema/relations/type-helpers";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOmit,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { Merge, Pretty, TrueKeys } from "../../type-helpers";
import type { PipelineStage } from "../types/pipeline-stage";
import type {
  BoolProjection,
  Projection,
  Sort,
  WithProjection,
} from "../types/query-options";
import { addPopulatePipeline, addPopulationMetas } from "../utils/populate";
import {
  addExtraInputsToProjection,
  makeProjection,
} from "../utils/projection";
import { Query } from "./base";

export class FindQuery<
  T extends AnySchema,
  O = InferSchemaOutput<T>,
  P extends ["omit" | "select", keyof any] = ["omit", InferSchemaOmit<T>],
> extends Query<T, WithProjection<P[0], P[1], O>[]> {
  private _projection: Projection<InferSchemaOutput<T>>;
  private _population: SchemaRelationSelect<T> = {};

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

  public populate<P extends Pretty<SchemaRelationSelect<T>>>(population: P) {
    Object.assign(this._population, population);
    return this as FindQuery<
      T,
      Pretty<
        Merge<O, Pretty<Merge<O, InferRelationPopulationObject<T, keyof P>>>>
      >
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
      // @ts-expect-error
      { $match: this._filter },
    ];
    const relations = Schema.relations(this._schema);
    for (const [field, options] of Object.entries(this._population)) {
      if (!options) continue;
      if (!relations[field]) {
        console.warn(`Relation '${field}' not found in schema`);
        continue;
      }
      addPopulatePipeline(pipeline, field, relations[field], options);
    }
    if (Object.keys(this._projection).length > 0) {
      // @ts-expect-error
      pipeline.push({ $project: this._projection });
    }
    addPopulationMetas(pipeline, {
      limit: this._options.limit,
      skip: this._options.skip,
      sort: this._options.sort,
    });
    const result = await this._collection.aggregate(pipeline).toArray();
    return result.length > 0
      ? result.map(
          (doc) =>
            Schema.fromData(
              this._schema,
              doc as InferSchemaData<T>,
              this._projection,
              null,
            ) as O,
        )
      : [];
  }
}
