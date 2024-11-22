import type {
  Filter,
  FindOptions,
  Collection as MongoCollection,
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
  WithProjection,
} from "../types/query-options";
import { addPopulatePipeline } from "../utils/populate";
import {
  addExtraInputsToProjection,
  makeProjection,
} from "../utils/projection";
import { Query } from "./base";

export class FindOneQuery<
  T extends AnySchema,
  O = InferSchemaOutput<T>,
  P extends ["omit" | "select", keyof any] = ["omit", InferSchemaOmit<T>],
> extends Query<T, WithProjection<P[0], P[1], O> | null> {
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

  public omit<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("omit", projection);
    return this as FindOneQuery<T, O, ["omit", TrueKeys<P>]>;
  }

  public select<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("select", projection);
    return this as FindOneQuery<T, O, ["select", TrueKeys<P>]>;
  }

  public populate<P extends Pretty<SchemaRelationSelect<T>>>(population: P) {
    const relations = Schema.relations(this._schema);
    const invalidFields = Object.keys(population).filter(
      (field) => !(field in relations),
    );
    if (invalidFields.length > 0) {
      throw new Error(`Invalid relation fields: ${invalidFields.join(", ")}`);
    }
    Object.assign(this._population, population);
    return this as FindOneQuery<
      T,
      Pretty<Merge<O, InferRelationPopulationObject<T, keyof P>>>
    >;
  }

  public async exec(): Promise<WithProjection<P[0], P[1], O> | null> {
    await this._readyPromise;
    if (Object.keys(this._population).length) {
      return this._execWithPopulate();
    }
    return this._execWithoutPopulate();
  }

  private async _execWithoutPopulate(): Promise<WithProjection<
    P[0],
    P[1],
    O
  > | null> {
    const extra = addExtraInputsToProjection(
      this._projection,
      this._schema.options.virtuals,
    );
    const res = await this._collection.findOne(this._filter, {
      ...this._options,
      projection: this._projection,
    });
    return res
      ? (Schema.fromData(
          this._schema,
          res as InferSchemaData<T>,
          this._projection,
          extra,
        ) as O)
      : res;
  }

  private async _execWithPopulate(): Promise<WithProjection<
    P[0],
    P[1],
    O
  > | null> {
    const pipeline: PipelineStage<InferSchemaOutput<T>>[] = [
      // @ts-expect-error
      { $match: this._filter },
      { $limit: 1 },
    ];
    const relations = Schema.relations(this._schema);
    for (const [field, select] of Object.entries(this._population)) {
      if (!select) continue;
      addPopulatePipeline(pipeline, field, relations[field]);
    }
    if (Object.keys(this._projection).length > 0) {
      // @ts-expect-error
      pipeline.push({ $project: this._projection });
    }

    const result = await this._collection.aggregate(pipeline).toArray();
    return result.length > 0
      ? (Schema.fromData(
          this._schema,
          result[0] as InferSchemaData<T>,
          this._projection,
          null,
        ) as O)
      : null;
  }
}
