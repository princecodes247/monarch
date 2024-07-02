import type {
  AnyBulkWriteOperation,
  Collection,
  DeleteResult,
  Filter,
  FindOptions,
  MongoClient,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateResult,
  WithId,
} from "mongodb";
import type { InferSchemaInput, InferSchemaOutput, Schema } from "../schema";
import { parseSchema } from "../schema";
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
export type Projection<T> = {
  [K in keyof T]?: 1 | 0;
};

export class QueryBuilder<T extends Schema<any, any>> {
  private _collection: Collection<InferSchemaOutput<T>>;

  constructor(private _client: MongoClient, private _schema: T) {
    this._collection = this._client
      .db()
      .collection<InferSchemaOutput<T>>(this._schema.name);
  }

  insert(values: OptionalUnlessRequiredId<InferSchemaInput<T>>) {
    const parsed = parseSchema(
      this._schema,
      values
    ) as OptionalUnlessRequiredId<InferSchemaOutput<T>>;
    return new InsertOneQuery(this._collection, parsed);
  }
  insertOne(values: OptionalUnlessRequiredId<InferSchemaInput<T>>) {
    const parsed = parseSchema(
      this._schema,
      values
    ) as OptionalUnlessRequiredId<InferSchemaOutput<T>>;
    return new InsertOneQuery(this._collection, parsed);
  }

  insertMany(values: OptionalUnlessRequiredId<InferSchemaInput<T>>[]) {
    const parsed = [];

    for (const value of values) {
      parsed.push(
        parseSchema(this._schema, value) as OptionalUnlessRequiredId<
          InferSchemaOutput<T>
        >
      );
    }

    return new InsertManyQuery(this._collection, parsed);
  }

  find() {
    return new FindQuery(this._collection);
  }

  findOne() {
    return new FindOneQuery(this._collection);
  }

  findOneAndDelete() {
    return new FindOneAndDeleteQuery(this._collection);
  }

  findOneAndUpdate(values: UpdateFilter<InferSchemaOutput<T>>) {
    return new FindOneAndUpdateQuery(this._collection, values);
  }

  findOneAndReplace(values: OptionalUnlessRequiredId<InferSchemaOutput<T>>) {
    return new FindOneAndReplaceQuery(this._collection, values);
  }

  count() {
    return new CountQuery(this._collection);
  }

  updateOne(values: UpdateFilter<InferSchemaOutput<T>>) {
    return new UpdateOneQuery(this._collection, values);
  }

  deleteOne() {
    return new DeleteOneQuery(this._collection);
  }

  aggregate(): AggregationPipeline<T> {
    return new AggregationPipeline(this._collection);
  }

  bulkWrite(values: AnyBulkWriteOperation<InferSchemaOutput<T>>[]) {
    return new BulkWriteQuery(this._collection, values);
  }

  // Indexing
  createIndex(values: IndexDefinitionKey<InferSchemaOutput<T>>, options?: IndexDefinitionOptions<InferSchemaOutput<T>>) {
    return new CreateIndexOperation(this._collection, values, options);
  }

  dropIndex(value: keyof InferSchemaOutput<T>) {
    return new DropIndexOperation(this._collection, value);
  }

  dropIndexes(values: keyof InferSchemaOutput<T>[]) {
    return new DropIndexesOperation(this._collection, values);
  }

  getIndexes() {
    return new GetIndexesQuery(this._collection);
  }
}

// Define a base query class
export class Query<T extends Schema<any, any>> {
  protected filters: Filter<InferSchemaOutput<T>> = {};
  protected projection: Projection<InferSchemaOutput<T>> = {};
  protected options: FindOptions = {};

  constructor(
    protected readonly _collection: Collection<InferSchemaOutput<T>>
  ) {}

  where(filter: Filter<InferSchemaOutput<T>>): this {
    Object.assign(this.filters, filter);
    return this;
  }

  select(projection: Projection<WithId<InferSchemaOutput<T>>>): this {
    Object.assign(this.projection, projection);
    return this;
  }

  limit(limit: number): this {
    this.options.limit = limit;
    return this;
  }

  skip(skip: number): this {
    this.options.skip = skip;
    return this;
  }
}

// Define a query class for find operations
export class FindQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>>[]> {
    return this._collection
      .find(this.filters, {
        ...this.options,
        projection: this.projection,
      })
      .toArray();
  }
}

// Define a query class for findOne operations
export class FindOneQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOne(this.filters, {
      projection: this.projection,
    });
  }
}

// Define a query class for count operations
export class CountQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<number> {
    return this._collection.countDocuments(this.filters);
  }
}

export class FindOneAndDeleteQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOneAndDelete(this.filters);
  }
}

export class FindOneAndUpdateQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: UpdateFilter<InferSchemaOutput<T>>
  ) {
    super(_collection);
  }

  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOneAndUpdate(this.filters, this.values);
  }
}

export class FindOneAndReplaceQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: OptionalUnlessRequiredId<InferSchemaOutput<T>>
  ) {
    super(_collection);
  }

  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOneAndReplace(this.filters, this.values);
  }
}

// Define a query class for insert operations
export class InsertOneQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: OptionalUnlessRequiredId<InferSchemaOutput<T>>
  ) {
    super(_collection);
  }

  async exec() {
    const result = await this._collection.insertOne(this.values);
    return { _id: result.insertedId, ...this.values };
  }
}

// Define a query class for insert operations
export class InsertManyQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: OptionalUnlessRequiredId<InferSchemaOutput<T>>[]
  ) {
    super(_collection);
  }

  async exec() {
    const result = await this._collection.insertMany(this.values);
    return result;
  }
}

// Define a query class for replaceOne operations
export class ReplaceOneQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: OptionalUnlessRequiredId<InferSchemaOutput<T>>
  ) {
    super(_collection);
  }

  async exec(): Promise<boolean> {
    const result = await this._collection.replaceOne(
      this.filters,
      this.values,
      this.options
    );
    return !!result.modifiedCount;
  }
}

// Define a query class for updateOne operations
export class UpdateOneQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: UpdateFilter<InferSchemaOutput<T>>
  ) {
    super(_collection);
  }

  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateOne(
      this.filters,
      this.values,
      this.options
    );
    return !!result.modifiedCount;
  }
}

// Define a query class for updateMany operations
export class UpdateManyQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: UpdateFilter<InferSchemaOutput<T>>
  ) {
    super(_collection);
  }

  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateMany(
      this.filters,
      this.values,
      this.options
    );
    return !!result.modifiedCount;
  }
}

// Define a query class for deleteOne operations
export class DeleteOneQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteOne(this.filters, this.options);
    return result;
  }
}

// Define a query class for deleteMany operations
export class DeleteManyQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteMany(
      this.filters,
      this.options
    );
    return result;
  }
}

// Define a class to represent an aggregation pipeline
export class AggregationPipeline<T extends Schema<any, any>> {
  private pipeline: PipelineStage<
    OptionalUnlessRequiredId<InferSchemaOutput<T>>
  >[] = [];

  constructor(private readonly _collection: Collection<InferSchemaOutput<T>>) {}

  // Method to add a stage to the aggregation pipeline
  addStage(
    stage: PipelineStage<OptionalUnlessRequiredId<InferSchemaOutput<T>>>
  ): this {
    this.pipeline.push(stage);
    return this;
  }

  // Method to execute the aggregation pipeline
  async exec(): Promise<any[]> {
    return this._collection.aggregate(this.pipeline).toArray();
  }
}

export class BulkWriteQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private values: AnyBulkWriteOperation<InferSchemaOutput<T>>[]
  ) {
    super(_collection);
  }
  async exec(): Promise<BulkWriteResult<InferSchemaOutput<T>>> {
    return this._collection.bulkWrite(this.values);
  }
}

type IndexType = "2d" | "2dsphere" | "hashed" | "text";

// Index operations
type IndexDefinitionOptions<T> = {
  key: { [K in keyof T]: 1 | -1 | IndexType};
  name?: string;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
  v?: number;
  partialFilterExpression?: { [K in keyof T]?: 1 | 0 };
};

type IndexDefinitionKey<T> = { [K in keyof T]: 1 | -1 | IndexType};

export class CreateIndexOperation<T extends Schema<any, any>> {
  constructor(
    protected readonly _collection: Collection<InferSchemaOutput<T>>,
    private values: IndexDefinitionKey<InferSchemaOutput<T>>,
    private options?: IndexDefinitionOptions<InferSchemaOutput<T>>
  ) {
    // super(_collection);
  }
  async exec() {
    return this._collection.createIndex(this.values, this.options);
  }
}

export class CreateIndexesOperation<T extends Schema<any, any>> {
  constructor(
    protected readonly _collection: Collection<InferSchemaOutput<T>>,
    private values: IndexDefinitionKey<InferSchemaOutput<T>>[],
    private options: IndexDefinitionOptions<InferSchemaOutput<T>>
  ) {}

  async exec() {
    return this._collection.createIndexes(this.values, this.options);
  }
}

export class DropIndexOperation<T extends Schema<any, any>> {
  constructor(
    protected readonly _collection: Collection<InferSchemaOutput<T>>,
    private values: keyof InferSchemaOutput<T>
  ) {}

  async exec() {
    return this._collection.dropIndex(this.values);
  }
}
