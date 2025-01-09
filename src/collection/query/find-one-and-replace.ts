import type {
  Filter,
  FindOneAndReplaceOptions,
  Collection as MongoCollection,
  WithoutId,
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

export class FindOneAndReplaceQuery<
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
    return this as FindOneAndReplaceQuery<T, O, ["omit", TrueKeys<P>]>;
  }

  public select<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("select", projection);
    return this as FindOneAndReplaceQuery<T, O, ["select", TrueKeys<P>]>;
  }

  public async exec(): Promise<WithProjection<P[0], P[1], O> | null> {
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

  // biome-ignore lint/suspicious/noThenProperty: We need automatic promise resolution
  then<TResult1 = WithProjection<P[0], P[1], O> | null, TResult2 = never>(
    onfulfilled?:
      | ((
          value: WithProjection<P[0], P[1], O> | null,
        ) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<WithProjection<P[0], P[1], O> | TResult | null> {
    return this.exec().catch(onrejected);
  }

  finally(
    onfinally?: (() => void) | undefined | null,
  ): Promise<WithProjection<P[0], P[1], O> | null> {
    return this.exec().finally(onfinally);
  }
}
