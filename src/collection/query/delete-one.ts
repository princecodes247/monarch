import type {
  DeleteOptions,
  DeleteResult,
  Filter,
  Collection as MongoCollection,
} from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { Query } from "./base";

export class DeleteOneQuery<T extends AnySchema> extends Query<
  T,
  DeleteResult
> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _options: DeleteOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
  }

  public options(options: DeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public async exec(): Promise<DeleteResult> {
    await this._readyPromise;
    const res = await this._collection.deleteOne(this._filter, this._options);
    return res;
  }
}
