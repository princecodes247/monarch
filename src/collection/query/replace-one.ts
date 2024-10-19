import type {
  Filter,
  Collection as MongoCollection,
  ReplaceOptions,
  UpdateResult,
  WithoutId,
} from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { Query } from "./base";

export class ReplaceOneQuery<T extends AnySchema> extends Query<
  T,
  UpdateResult<InferSchemaData<T>>
> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _replacement: WithoutId<InferSchemaData<T>>,
    private _options: ReplaceOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
  }

  public options(options: ReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public async exec(): Promise<UpdateResult<InferSchemaData<T>>> {
    await this._readyPromise;
    const res = await this._collection.replaceOne(
      this._filter,
      this._replacement,
      this._options,
    );
    return res as UpdateResult<InferSchemaData<T>>;
  }
}
