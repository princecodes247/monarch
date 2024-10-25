import type {
  Filter,
  FindOneAndReplaceOptions,
  Collection as MongoCollection,
  WithoutId,
} from "mongodb";
import type { SchemaRelationSelect } from "../../relations/type-helpers";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOmit,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { Pretty, TrueKeys } from "../../type-helpers";
import type {
  BoolProjection,
  Projection,
  WithProjection,
} from "../types/query-options";
import {
  addExtraInputsToProjection,
  makeProjection,
} from "../utils/projection";
import { Query } from "./base";

export class FindOneAndReplaceQuery<
  T extends AnySchema,
  O = WithProjection<"omit", InferSchemaOutput<T>, InferSchemaOmit<T>>,
> extends Query<T, O | null> {
  private _projection: Projection<InferSchemaOutput<T>>;
  private _population: SchemaRelationSelect<T> = {};

  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _replacement: WithoutId<InferSchemaData<T>>,
    private _options: FindOneAndReplaceOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
    this._projection = makeProjection("omit", _schema.options.omit ?? {});
  }

  public options(options: FindOneAndReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public omit<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("omit", projection);
    return this as FindOneAndReplaceQuery<
      T,
      WithProjection<"omit", InferSchemaOutput<T>, TrueKeys<P>>
    >;
  }

  public select<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("select", projection);
    return this as FindOneAndReplaceQuery<
      T,
      WithProjection<"select", InferSchemaOutput<T>, TrueKeys<P>>
    >;
  }

  public populate<P extends Pretty<SchemaRelationSelect<T>>>(population: P) {
    Object.assign(this._population, population);
    return this as FindOneAndReplaceQuery<T, InferSchemaOutput<T>>;
  }

  public async exec(): Promise<O | null> {
    await this._readyPromise;
    const extra = addExtraInputsToProjection(
      this._projection,
      this._schema.options.virtuals,
    );
    const res = await this._collection.findOneAndReplace(
      this._filter,
      this._replacement,
      { ...this._options, projection: this._projection },
    );
    return res
      ? (Schema.fromData(
          this._schema,
          res as InferSchemaData<T>,
          this._projection,
          extra,
        ) as O)
      : res;
  }
}
