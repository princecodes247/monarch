import type {
  AggregateOptions,
  AnyBulkWriteOperation,
  Collection,
  DeleteOptions,
  DeleteResult,
  DropIndexesOptions,
  Filter,
  FindOneAndDeleteOptions,
  FindOneAndReplaceOptions,
  FindOneAndUpdateOptions,
  FindOptions,
  IndexDirection,
  IndexSpecification,
  MongoClient,
  OptionalUnlessRequiredId,
  ReplaceOptions,
  UpdateOptions,
  UpdateResult,
  WithId,
} from "mongodb";
import { MonarchError } from "../errors";
import { AnySchema } from "../schema/schema";
import {
  InferSchemaData,
  InferSchemaInput,
  InferSchemaOutput,
} from "../schema/type-helpers";
import { PipelineStage } from "./pipeline-stage";

type BulkWriteResult<T> = {
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  insertedIds: { [key: number]: T };
  upsertedIds: { [key: number]: T };
};

type IndexType = "2d" | "2dsphere" | "hashed" | "text";

// Index operations
type IndexDefinitionOptions<T> = {
  name?: string;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
  v?: number;
  partialFilterExpression?: { [K in keyof T]?: 1 | 0 };
};

type IndexDefinitionKey<T> = { [K in keyof T]: IndexDirection | IndexType };

export type Projection<T> = {
  [K in keyof T]?: 1 | 0;
};
export type UpdateFilter<T> = {
  $currentDate?: { [K in keyof T]?: true | { $type: "date" | "timestamp" } };
  $inc?: { [K in keyof T]?: number };
  $min?: { [K in keyof T]?: T[K] };
  $max?: { [K in keyof T]?: T[K] };
  $mul?: { [K in keyof T]?: number };
  $rename?: { [K in keyof T]?: string };
  $set?: Partial<T>;
  $setOnInsert?: Partial<T>;
  $unset?: { [K in keyof T]?: "" | 1 | true };
  $addToSet?: { [K in keyof T]?: T[K] | { $each: T[K][] } };
  $pop?: { [K in keyof T]?: -1 | 1 };
  $pull?: { [K in keyof T]?: T[K] | { [key: string]: any } };
  $push?: {
    [K in keyof T]?:
      | T[K]
      | {
          $each: T[K][];
          $position?: number;
          $slice?: number;
          $sort?: 1 | -1 | { [key: string]: 1 | -1 };
        };
  };
  $pullAll?: { [K in keyof T]?: T[K][] };
} & {
  // [K in keyof T]?: T[K] | { $each: T[K][] } | { $position?: number; $slice?: number; $sort?: 1 | -1 | { [key: string]: 1 | -1 } } | { $each: T[K][] } | UpdateFilter<T>;
  [K in keyof T]?: T[K] | UpdateFilter<T[K]>;
};

export class QueryBuilder<T extends AnySchema> {
  private _collection: Collection<InferSchemaData<T>>;

  constructor(_client: MongoClient, private _schema: T) {
    const db = _client.db();
    // create indexes
    if (_schema.options?.indexes) {
      const indexes = _schema.options.indexes({
        createIndex: (fields, options) => [fields, options],
        unique: (field) => [{ [field]: 1 as const }, { unique: true }],
      });
      for (const [key, [fields, options]] of Object.entries(indexes)) {
        db.createIndex(
          _schema.name,
          fields as IndexSpecification,
          options
        ).catch((error) => {
          throw new MonarchError(`failed to create index '${key}': ${error}`);
        });
      }
    }
    this._collection = db.collection<InferSchemaData<T>>(this._schema.name);
  }

  insert() {
    return new InsertOneQuery(this._collection, this._schema);
  }
  insertOne() {
    return new InsertOneQuery(this._collection, this._schema);
  }

  insertMany() {
    return new InsertManyQuery(this._collection, this._schema);
  }

  find() {
    return new FindQuery(this._collection, this._schema);
  }

  findOne() {
    return new FindOneQuery(this._collection, this._schema);
  }

  findOneAndDelete() {
    return new FindOneAndDeleteQuery(this._collection, this._schema);
  }

  findOneAndUpdate() {
    return new FindOneAndUpdateQuery(this._collection, this._schema);
  }

  findOneAndReplace() {
    return new FindOneAndReplaceQuery(this._collection, this._schema);
  }

  count() {
    return new CountQuery(this._collection, this._schema);
  }

  updateOne() {
    return new UpdateOneQuery(this._collection, this._schema);
  }

  updateMany() {
    return new UpdateManyQuery(this._collection, this._schema);
  }

  deleteOne() {
    return new DeleteOneQuery(this._collection, this._schema);
  }

  deleteMany() {
    return new DeleteManyQuery(this._collection, this._schema);
  }

  aggregate(): AggregationPipeline<T> {
    return new AggregationPipeline(this._collection);
  }

  bulkWrite() {
    return new BulkWriteQuery(this._collection, this._schema);
  }

  // Indexing
  createIndex(
    key: IndexDefinitionKey<Partial<InferSchemaOutput<T>>>,
    options?: IndexDefinitionOptions<InferSchemaOutput<T>>
  ) {
    return this._collection.createIndex(key, options);
  }

  createIndexes(
    keys: IndexDefinitionKey<Partial<InferSchemaOutput<T>>>[],
    options?: IndexDefinitionOptions<InferSchemaOutput<T>>
  ) {
    return this._collection.createIndexes(
      keys.map((key) => ({ key, ...options })),
      options
    );
  }

  dropIndex(value: string) {
    return this._collection.dropIndex(value as string);
  }

  dropIndexes(options?: DropIndexesOptions) {
    return this._collection.dropIndexes(options);
  }

  listIndexes() {
    return this._collection.listIndexes();
  }
}

// Define a base query class
export class Query<T extends AnySchema> {
  protected filters: Filter<InferSchemaData<T>> = {};
  protected projection: Projection<WithId<InferSchemaData<T>>> = {};
  protected _options: FindOptions = {};

  constructor(
    protected readonly _collection: Collection<InferSchemaData<T>>,
    protected _schema: T
  ) {}

  where(filter: Filter<InferSchemaData<T>>): this {
    Object.assign(this.filters, filter);
    return this;
  }

  select(...fields: (keyof WithId<InferSchemaData<T>>)[]): this {
    this.projection = fields.reduce((acc, field) => {
      acc[field] = 1;
      return acc;
    }, {} as Projection<WithId<InferSchemaData<T>>>);
    return this;
  }

  omit(...fields: (keyof WithId<InferSchemaData<T>>)[]): this {
    this.projection = fields.reduce((acc, field) => {
      acc[field] = 0;
      return acc;
    }, {} as Projection<WithId<InferSchemaData<T>>>);
    return this;
  }

  limit(limit: number): this {
    this._options.limit = limit;
    return this;
  }

  skip(skip: number): this {
    this._options.skip = skip;
    return this;
  }

  options(options: FindOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<any> {
    throw new Error("exec() method must be implemented in subclasses");
  }
}

export class MutationBaseQuery<T extends AnySchema> extends Query<T> {
  protected data = {} as OptionalUnlessRequiredId<InferSchemaData<T>>;

  values(values: UpdateFilter<InferSchemaData<T>>): this {
    Object.assign(this.data, values);
    return this;
  }
  set(values: UpdateFilter<InferSchemaData<T>>): this {
    Object.assign(this.data, { $set: values });
    return this;
  }
}

export class InsertBaseQuery<T extends AnySchema> extends Query<T> {
  protected data = {} as InferSchemaData<T>;

  values(data: InferSchemaInput<T>): this {
    this.data = this._schema.toData(data);
    return this;
  }
}

export class InsertManyBaseQuery<T extends AnySchema> extends Query<T> {
  protected data = [] as InferSchemaData<T>[];

  values(data: InferSchemaInput<T>[]): this {
    this.data = data.map((value) => this._schema.toData(value));
    return this;
  }
}

// Define specific query classes
export class FindQuery<T extends AnySchema> extends Query<T> {
  async exec(): Promise<InferSchemaOutput<T>[]> {
    return this._collection
      .find(this.filters, {
        ...this._options,
        projection: this.projection,
      })
      .toArray()
      .then((res) => res.map((res) => this._schema.fromData(res)));
  }
}

export class FindOneQuery<T extends AnySchema> extends Query<T> {
  async exec(): Promise<InferSchemaOutput<T> | null> {
    return this._collection
      .findOne(this.filters, {
        projection: this.projection,
      })
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class CountQuery<T extends AnySchema> extends Query<T> {
  async exec(): Promise<number> {
    return this._collection.countDocuments(this.filters);
  }
}

export class FindOneAndDeleteQuery<T extends AnySchema> extends Query<T> {
  protected _options: FindOneAndDeleteOptions = {};

  options(options: FindOneAndDeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T> | null> {
    return this._collection
      .findOneAndDelete(this.filters, this._options)
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class FindOneAndUpdateQuery<
  T extends AnySchema
> extends MutationBaseQuery<T> {
  protected _options: FindOneAndUpdateOptions = {};

  options(options: FindOneAndUpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T> | null> {
    return await this._collection
      .findOneAndUpdate(this.filters, this.data, this._options)
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class FindOneAndReplaceQuery<
  T extends AnySchema
> extends MutationBaseQuery<T> {
  protected _options: FindOneAndReplaceOptions = {};

  options(options: FindOneAndReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T> | null> {
    return this._collection
      .findOneAndReplace(this.filters, this.data, this._options)
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class InsertOneQuery<T extends AnySchema> extends InsertBaseQuery<T> {
  async exec(): Promise<InferSchemaOutput<T>> {
    const result = await this._collection.insertOne(
      this.data as OptionalUnlessRequiredId<InferSchemaData<T>>
    );
    return this._schema.fromData({ _id: result.insertedId, ...this.data });
  }
}

export class InsertManyQuery<
  T extends AnySchema
> extends InsertManyBaseQuery<T> {
  async exec(): Promise<InferSchemaOutput<T>[]> {
    const result = await this._collection.insertMany(
      this.data as OptionalUnlessRequiredId<InferSchemaData<T>>[]
    );
    return this.data.map((data, index) =>
      this._schema.fromData({ _id: result.insertedIds[index], ...data })
    );
  }
}

export class ReplaceOneQuery<T extends AnySchema> extends MutationBaseQuery<T> {
  protected _options: ReplaceOptions = {};

  options(options: ReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<boolean> {
    const result = await this._collection.replaceOne(
      this.filters,
      this.data,
      this._options
    );
    return !!result.modifiedCount;
  }
}

export class UpdateOneQuery<T extends AnySchema> extends MutationBaseQuery<T> {
  protected _options: UpdateOptions = {};

  options(options: UpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateOne(
      this.filters,
      this.data,
      this._options
    );
    return !!result.modifiedCount;
  }
}

export class UpdateManyQuery<T extends AnySchema> extends MutationBaseQuery<T> {
  protected _options: UpdateOptions = {};

  options(options: UpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateMany(
      this.filters,
      this.data,
      this._options
    );
    return !!result.modifiedCount;
  }
}

export class DeleteOneQuery<T extends AnySchema> extends Query<T> {
  protected _options: DeleteOptions = {};

  options(options: DeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteOne(
      this.filters,
      this._options
    );
    return result;
  }
}

export class DeleteManyQuery<T extends AnySchema> extends Query<T> {
  protected _options: DeleteOptions = {};

  options(options: DeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteMany(
      this.filters,
      this._options
    );
    return result;
  }
}

export class BulkWriteQuery<T extends AnySchema> extends Query<T> {
  protected data = [] as AnyBulkWriteOperation<InferSchemaData<T>>[];

  values(data: AnyBulkWriteOperation<InferSchemaData<T>>[]): this {
    this.data = data;
    return this;
  }

  async exec(): Promise<BulkWriteResult<InferSchemaData<T>>> {
    return this._collection.bulkWrite(this.data);
  }
}

// Define a class to represent an aggregation pipeline
export class AggregationPipeline<T extends AnySchema> {
  private pipeline: PipelineStage<
    OptionalUnlessRequiredId<InferSchemaData<T>>
  >[] = [];
  private _options: AggregateOptions = {};

  constructor(private readonly _collection: Collection<InferSchemaData<T>>) {}

  options(options: AggregateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  // Method to add a stage to the aggregation pipeline
  addStage(
    stage: PipelineStage<OptionalUnlessRequiredId<InferSchemaData<T>>>
  ): this {
    this.pipeline.push(stage);
    return this;
  }

  // Method to execute the aggregation pipeline
  async exec() {
    return this._collection.aggregate(this.pipeline, this._options);
  }
}
