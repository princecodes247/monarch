import type {
  InsertOneOptions,
  Collection as MongoCollection,
  OptionalUnlessRequiredId,
} from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaInput,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { Projection } from "../types/query-options";
import { makeProjection } from "../utils/projection";
import { Query } from "./base";

export class InsertOneQuery<
  T extends AnySchema,
  O = InferSchemaOutput<T>,
> extends Query<T, O> {
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

  public async exec(): Promise<O> {
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
}
