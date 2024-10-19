import type {
  AnyBulkWriteOperation,
  BulkWriteOptions,
  BulkWriteResult,
  Collection as MongoCollection,
} from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { Query } from "./base";

export class BulkWriteQuery<T extends AnySchema> extends Query<
  T,
  BulkWriteResult
> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _data: AnyBulkWriteOperation<InferSchemaData<T>>[],
    private _options: BulkWriteOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
  }

  public options(options: BulkWriteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public async exec(): Promise<BulkWriteResult> {
    await this._readyPromise;
    const res = await this._collection.bulkWrite(this._data, this._options);
    return res;
  }
}
