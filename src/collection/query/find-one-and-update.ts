import type {
  Filter,
  FindOneAndUpdateOptions,
  MatchKeysAndValues,
  Collection as MongoCollection,
  UpdateFilter,
} from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOmit,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { TrueKeys } from "../../type-helpers";
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

export class FindOneAndUpdateQuery<
  T extends AnySchema,
  O = InferSchemaOutput<T>,
  P extends ["omit" | "select", keyof any] = ["omit", InferSchemaOmit<T>],
> extends Query<T, WithProjection<P[0], P[1], O> | null> {
  private _projection: Projection<InferSchemaOutput<T>>;

  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _update: UpdateFilter<InferSchemaData<T>>,
    private _options: FindOneAndUpdateOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
    this._projection = makeProjection("omit", _schema.options.omit ?? {});
  }

  public options(options: FindOneAndUpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public omit<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("omit", projection);
    return this as FindOneAndUpdateQuery<T, O, ["omit", TrueKeys<P>]>;
  }

  public select<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("select", projection);
    return this as FindOneAndUpdateQuery<T, O, ["select", TrueKeys<P>]>;
  }

  public async exec(): Promise<WithProjection<P[0], P[1], O> | null> {
    await this._readyPromise;
    const fieldUpdates = Schema.getFieldUpdates(
      this._schema,
    ) as MatchKeysAndValues<InferSchemaData<T>>;
    this._update.$set = { ...fieldUpdates, ...this._update.$set };

    const extra = addExtraInputsToProjection(
      this._projection,
      this._schema.options.virtuals,
    );
    const res = await this._collection.findOneAndUpdate(
      this._filter,
      this._update,
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
