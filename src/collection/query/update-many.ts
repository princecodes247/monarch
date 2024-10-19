import type {
  Filter,
  FindOptions,
  MatchKeysAndValues,
  Collection as MongoCollection,
  UpdateFilter,
  UpdateResult,
} from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { Query } from "./base";

export class UpdateManyQuery<T extends AnySchema> extends Query<
  T,
  UpdateResult<InferSchemaData<T>>
> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _update: UpdateFilter<InferSchemaData<T>>,
    private _options: FindOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
  }

  public options(options: FindOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public async exec(): Promise<UpdateResult<InferSchemaData<T>>> {
    await this._readyPromise;
    const fieldUpdates = Schema.getFieldUpdates(
      this._schema,
    ) as MatchKeysAndValues<InferSchemaData<T>>;
    this._update.$set = { ...fieldUpdates, ...this._update.$set };

    const res = await this._collection.updateMany(
      this._filter,
      this._update,
      this._options,
    );
    return res;
  }
}
