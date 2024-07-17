import type {
  AbstractCursorOptions,
  AggregateOptions,
  AnyBulkWriteOperation,
  ChangeStreamOptions,
  Collection,
  DeleteOptions,
  DeleteResult,
  DropIndexesOptions,
  EstimatedDocumentCountOptions,
  Filter,
  FindOneAndDeleteOptions,
  FindOneAndReplaceOptions,
  FindOneAndUpdateOptions,
  FindOptions,
  IndexDirection,
  IndexInformationOptions,
  IndexSpecification,
  MongoClient,
  OperationOptions,
  OptionalUnlessRequiredId,
  RenameOptions,
  ReplaceOptions,
  SearchIndexDescription,
  UpdateOptions,
  UpdateResult,
  WithId
} from "mongodb";
import { MonarchError } from "../errors";
import { AnySchema } from "../schema/schema";
import {
  InferSchemaData,
  InferSchemaInput,
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

  find(filter?: Filter<InferSchemaData<T>>) {
    return new FindQuery(this._collection, this._schema, filter);
  }

  findOne(filter?: Filter<InferSchemaData<T>>) {
    return new FindOneQuery(this._collection, this._schema, filter);
  }

  findOneAndDelete(filter?: Filter<InferSchemaData<T>>) {
    return new FindOneAndDeleteQuery(this._collection, this._schema, filter);
  }

  findOneAndUpdate(filter?: Filter<InferSchemaData<T>>) {
    return new FindOneAndUpdateQuery(this._collection, this._schema, filter);
  }

  findOneAndReplace(filter?: Filter<InferSchemaData<T>>) {
    return new FindOneAndReplaceQuery(this._collection, this._schema, filter);
  }

  count(filter?: Filter<InferSchemaData<T>>) {
    return new CountQuery(this._collection, this._schema, filter);
  }

  updateOne(filter?: Filter<InferSchemaData<T>>) {
    return new UpdateOneQuery(this._collection, this._schema, filter);
  }

  updateMany(filter?: Filter<InferSchemaData<T>>) {
    return new UpdateManyQuery(this._collection, this._schema, filter);
  }

  deleteOne(filter?: Filter<InferSchemaData<T>>) {
    return new DeleteOneQuery(this._collection, this._schema, filter);
  }

  deleteMany(filter?: Filter<InferSchemaData<T>>) {
    return new DeleteManyQuery(this._collection, this._schema, filter);
  }

  replaceOne(filter?: Filter<InferSchemaData<T>>) {
    return new ReplaceOneQuery(this._collection, this._schema, filter);
  }

  aggregate(pipeline?: PipelineStage<OptionalUnlessRequiredId<InferSchemaData<T>>>[]): AggregationPipeline<T> {
    return new AggregationPipeline(this._collection, pipeline);
  }

  watch(pipeline?: PipelineStage<any>[]) {
    return new WatchPipeline(this._collection, pipeline);
  }

  bulkWrite() {
    return new BulkWriteQuery(this._collection, this._schema);
  }

  distinct(field: keyof InferSchemaData<T>, filter?: Filter<InferSchemaData<T>>) {
    return new DistinctQuery(this._collection, this._schema, field, filter);
  }


  async drop() {
    return this._collection.drop();
  }

  estimatedDocumentCount(options?: EstimatedDocumentCountOptions) {
    return this._collection.estimatedDocumentCount(options);
  }

  isCapped() {
    return this._collection.isCapped();
  }

  options(options?: OperationOptions) {
    return this._collection.options(options);
  }

  rename(newName: string, options?: RenameOptions) {
    return this._collection.rename(newName, options);
  }

  // Indexing
  createIndex(
    key: IndexDefinitionKey<Partial<InferSchemaData<T>>>,
    options?: IndexDefinitionOptions<InferSchemaData<T>>
  ) {
    return this._collection.createIndex(key, options);
  }

  createIndexes(
    keys: IndexDefinitionKey<Partial<InferSchemaData<T>>>[],
    options?: IndexDefinitionOptions<InferSchemaData<T>>
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

  indexExists(name: string, options?: AbstractCursorOptions) {
    return this._collection.indexExists(name, options);
  }

  indexInformation(options: IndexInformationOptions & {
    full?: boolean;
  }) {
    return this._collection.indexInformation(options);
  }

  createSearchIndex(description: SearchIndexDescription) {
    return this._collection.createSearchIndex(description);
  }

  createSearchIndexes(descriptions: SearchIndexDescription[]) {
    return this._collection.createSearchIndexes(descriptions);
  }

  dropSearchIndex(name: string) {
    return this._collection.dropSearchIndex(name);
  }

  listSearchIndexes() {
    return this._collection.listSearchIndexes();
  }

  updateSearchIndex(name: string, description: SearchIndexDescription) {
    return this._collection.updateSearchIndex(name, description);
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
  ) { }


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

  options(options: FindOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<any> {
    throw new Error("exec() method must be implemented in subclasses");
  }
}


export class BaseFindQuery<T extends AnySchema> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaData<T>>,
    protected _schema: T,
    _filters?: Filter<InferSchemaData<T>>,
  ) {
    super(_collection, _schema);
    Object.assign(this.filters, _filters);
  }

  where(filter: Filter<InferSchemaData<T>>): this {
    Object.assign(this.filters, filter);
    return this;
  }

}

export class BaseFindManyQuery<T extends AnySchema> extends BaseFindQuery<T> {

  limit(limit: number): this {
    this._options.limit = limit;
    return this;
  }

  skip(skip: number): this {
    this._options.skip = skip;
    return this;
  }
}


export class BaseMutationQuery<T extends AnySchema> extends BaseFindQuery<T> {
  protected data = {} as OptionalUnlessRequiredId<InferSchemaData<T>>;

  constructor(
    _collection: Collection<InferSchemaData<T>>,
    protected _schema: T,
    _filters?: Filter<InferSchemaData<T>>,
  ) {
    super(_collection, _schema, _filters);
  }

  values(data: UpdateFilter<InferSchemaData<T>>): this {
    Object.assign(this.data, data);
    // this.data = parseSchema(this._schema, data) as OptionalUnlessRequiredId<InferSchemaData<T>>;
    return this;
  }
}

export class BaseUpdateQuery<T extends AnySchema> extends BaseMutationQuery<T> {
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

export class BaseInsertQuery<T extends AnySchema> extends Query<T> {
  protected data = {} as InferSchemaData<T>;

  values(data: InferSchemaInput<T>): this {
    this.data = this._schema.toData(data);
    return this;
  }
}

export class BaseInsertManyQuery<T extends AnySchema> extends Query<T> {
  protected data = [] as InferSchemaData<T>[];

  values(data: InferSchemaInput<T>[]): this {
    this.data = data.map((value) => this._schema.toData(value));
    return this;
  }
}


export class CountQuery<T extends AnySchema> extends BaseFindQuery<T> {
  async exec(): Promise<number> {
    return this._collection.countDocuments(this.filters);
  }
}

export class DistinctQuery<T extends AnySchema> extends BaseFindQuery<T> {

  constructor(
    _collection: Collection<InferSchemaData<T>>,
    protected _schema: T,
    private _field: keyof InferSchemaData<T>,
    _filters?: Filter<InferSchemaData<T>>,
  ) {
    super(_collection, _schema);
  }

  async exec(): Promise<any[]> {

    return this._collection.distinct(this._field, this.filters);
  }
}





export class FindQuery<T extends AnySchema> extends BaseFindManyQuery<T> {
  async exec(): Promise<InferSchemaData<T>[]> {
    return this._collection
      .find(this.filters, {
        ...this._options,
        projection: this.projection,
      })
      .toArray()
      .then((res) => res.map((res) => this._schema.fromData(res)));
  }
}

export class FindOneQuery<T extends AnySchema> extends BaseFindManyQuery<T> {
  async exec(): Promise<InferSchemaData<T> | null> {
    return this._collection
      .findOne(this.filters, {
        projection: this.projection,
      })
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class FindOneAndDeleteQuery<T extends AnySchema> extends BaseFindQuery<T> {
  protected _options: FindOneAndDeleteOptions = {};

  options(options: FindOneAndDeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaData<T> | null> {
    return this._collection
      .findOneAndDelete(this.filters, this._options)
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class FindOneAndUpdateQuery<T extends AnySchema> extends BaseMutationQuery<T> {
  protected _options: FindOneAndUpdateOptions = {};

  options(options: FindOneAndUpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaData<T> | null> {
    return await this._collection
      .findOneAndUpdate(this.filters, this.data, this._options)
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class FindOneAndReplaceQuery<
  T extends AnySchema
> extends BaseMutationQuery<T> {
  protected _options: FindOneAndReplaceOptions = {};

  options(options: FindOneAndReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaData<T> | null> {
    return this._collection
      .findOneAndReplace(this.filters, this.data, this._options)
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}

export class InsertOneQuery<T extends AnySchema> extends BaseInsertQuery<T> {
  async exec(): Promise<InferSchemaData<T>> {
    const result = await this._collection.insertOne(
      this.data as OptionalUnlessRequiredId<InferSchemaData<T>>
    );
    return this._schema.fromData({ _id: result.insertedId, ...this.data });
  }
}

export class InsertManyQuery<
  T extends AnySchema
> extends BaseInsertManyQuery<T> {
  async exec(): Promise<InferSchemaData<T>[]> {
    const result = await this._collection.insertMany(
      this.data as OptionalUnlessRequiredId<InferSchemaData<T>>[]
    );
    return this.data.map((data, index) =>
      this._schema.fromData({ _id: result.insertedIds[index], ...data })
    );
  }
}

export class ReplaceOneQuery<T extends AnySchema> extends BaseMutationQuery<T> {
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
    console.log({ result })
    return !!result.modifiedCount;
  }
}

export class UpdateOneQuery<T extends AnySchema> extends BaseUpdateQuery<T> {
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

export class UpdateManyQuery<T extends AnySchema> extends BaseUpdateQuery<T> {
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

export class DeleteOneQuery<T extends AnySchema> extends BaseFindQuery<T> {
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

export class DeleteManyQuery<T extends AnySchema> extends BaseFindQuery<T> {
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

export class Pipeline<T extends AnySchema> {
  protected pipeline: PipelineStage<
    OptionalUnlessRequiredId<InferSchemaData<T>>
  >[] = [];
  protected _options: AggregateOptions = {};

  constructor(protected readonly _collection: Collection<InferSchemaData<T>>,
    pipeline?: PipelineStage<OptionalUnlessRequiredId<InferSchemaData<T>>>[]) {
    if (pipeline) {
      this.pipeline = pipeline;
    }
  }


  options(options: AggregateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  // Method to add a stage to the pipeline
  addStage(
    stage: PipelineStage<OptionalUnlessRequiredId<InferSchemaData<T>>>
  ): this {
    this.pipeline.push(stage);
    return this;
  }

}

export class AggregationPipeline<T extends AnySchema> extends Pipeline<T> {

  options(options: AggregateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  // Method to execute the aggregation pipeline
  async exec() {
    const aggregatedData = this._collection.aggregate(this.pipeline, this._options);
    return await aggregatedData.toArray()
  }
}

export class WatchPipeline<T extends AnySchema> extends Pipeline<T> {
  protected _options: ChangeStreamOptions = {};

  options(options: ChangeStreamOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  addStage(
    stage: PipelineStage<any>
  ): this {
    this.pipeline.push(stage);
    return this;
  }

  // Method to execute the watch pipeline
  exec() {
    return this._collection.watch(this.pipeline, this._options);
  }
}
