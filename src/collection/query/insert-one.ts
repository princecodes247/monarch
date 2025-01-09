import type {
  InsertOneOptions,
  Collection as MongoCollection,
  OptionalUnlessRequiredId,
} from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaInput,
  InferSchemaOmit,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { Projection, WithProjection } from "../types/query-options";
import { makeProjection } from "../utils/projection";
import { Query } from "./base";

export class InsertOneQuery<
  T extends AnySchema,
  O = InferSchemaOutput<T>,
  P extends ["omit" | "select", keyof any] = ["omit", InferSchemaOmit<T>],
> extends Query<T, WithProjection<P[0], P[1], O>> {
  private _projection: Projection<InferSchemaOutput<T>>;

  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _data: InferSchemaInput<T>,
    private _options: InsertOneOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
    this._projection = makeProjection("omit", _schema.options.omit ?? {});
  }

  public options(options: InsertOneOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public async exec(): Promise<WithProjection<P[0], P[1], O>> {
    await this._readyPromise;
    const data = Schema.toData(this._schema, this._data);
    const res = await this._collection.insertOne(
      data as OptionalUnlessRequiredId<InferSchemaData<T>>,
      this._options,
    );
    return Schema.fromData(
      this._schema,
      {
        ...data,
        _id: res.insertedId,
      },
      this._projection,
      Object.keys(this._projection),
    ) as O;
  }

  // biome-ignore lint/suspicious/noThenProperty: We need automatic promise resolution
  then<TResult1 = WithProjection<P[0], P[1], O>, TResult2 = never>(
    onfulfilled?:
      | ((
          value: WithProjection<P[0], P[1], O>,
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
  ): Promise<WithProjection<P[0], P[1], O> | TResult> {
    return this.exec().catch(onrejected);
  }

  finally(
    onfinally?: (() => void) | undefined | null,
  ): Promise<WithProjection<P[0], P[1], O>> {
    return this.exec().finally(onfinally);
  }
}
