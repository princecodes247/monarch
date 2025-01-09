import type {
  BulkWriteOptions,
  InsertManyResult,
  Collection as MongoCollection,
  OptionalUnlessRequiredId,
} from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaInput,
} from "../../schema/type-helpers";
import { Query } from "./base";

export class InsertManyQuery<T extends AnySchema> extends Query<
  T,
  InsertManyResult<InferSchemaData<T>>
> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _data: InferSchemaInput<T>[],
    private _options: BulkWriteOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
  }

  public options(options: BulkWriteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public async exec(): Promise<InsertManyResult<InferSchemaData<T>>> {
    await this._readyPromise;
    const data = this._data.map((data) => Schema.toData(this._schema, data));
    const res = await this._collection.insertMany(
      data as OptionalUnlessRequiredId<InferSchemaData<T>>[],
      this._options,
    );
    return res;
  }

  // biome-ignore lint/suspicious/noThenProperty: We need automatic promise resolution
  then<TResult1 = InsertManyResult<InferSchemaData<T>>, TResult2 = never>(
    onfulfilled?:
      | ((
          value: InsertManyResult<InferSchemaData<T>>,
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
  ): Promise<InsertManyResult<InferSchemaData<T>> | TResult> {
    return this.exec().catch(onrejected);
  }

  finally(
    onfinally?: (() => void) | undefined | null,
  ): Promise<InsertManyResult<InferSchemaData<T>>> {
    return this.exec().finally(onfinally);
  }
}
