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
import type { InferSchemaInput, InferSchemaOutput, Schema } from "../schema";
import { parseSchema } from "../schema";
import { PipelineStage } from "./pipeline-stage";
// import { PipelineStage } from "./pipeline-stage";

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
  $push?: { [K in keyof T]?: T[K] | { $each: T[K][]; $position?: number; $slice?: number; $sort?: 1 | -1 | { [key: string]: 1 | -1 } } };
  $pullAll?: { [K in keyof T]?: T[K][] };
} & {
    // [K in keyof T]?: T[K] | { $each: T[K][] } | { $position?: number; $slice?: number; $sort?: 1 | -1 | { [key: string]: 1 | -1 } } | { $each: T[K][] } | UpdateFilter<T>;
    [K in keyof T]?: T[K] | UpdateFilter<T[K]>;
  };


export class QueryBuilder<T extends Schema<any, any>> {
  private _collection: Collection<InferSchemaOutput<T>>;

  constructor(private _client: MongoClient, private _schema: T) {
    this._collection = this._client
      .db()
      .collection<InferSchemaOutput<T>>(this._schema.name);
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

  find(filter?: Filter<InferSchemaOutput<T>>) {
    return new FindQuery(this._collection, filter);
  }

  findOne(filter?: Filter<InferSchemaOutput<T>>) {
    return new FindOneQuery(this._collection, filter);
  }

  findOneAndDelete(filter?: Filter<InferSchemaOutput<T>>) {
    return new FindOneAndDeleteQuery(this._collection, filter);
  }

  findOneAndUpdate(filter?: Filter<InferSchemaOutput<T>>) {
    return new FindOneAndUpdateQuery(this._collection, this._schema, filter);
  }

  findOneAndReplace(filter?: Filter<InferSchemaOutput<T>>) {
    return new FindOneAndReplaceQuery(this._collection, this._schema, filter);
  }

  count(filter?: Filter<InferSchemaOutput<T>>) {
    return new CountQuery(this._collection, filter);
  }

  updateOne(filter?: Filter<InferSchemaOutput<T>>) {
    return new UpdateOneQuery(this._collection, this._schema, filter);
  }

  updateMany(filter?: Filter<InferSchemaOutput<T>>) {
    return new UpdateManyQuery(this._collection, this._schema, filter);
  }

  deleteOne(filter?: Filter<InferSchemaOutput<T>>) {
    return new DeleteOneQuery(this._collection, filter);
  }

  deleteMany(filter?: Filter<InferSchemaOutput<T>>) {
    return new DeleteManyQuery(this._collection, filter);
  }

  replaceOne(filter?: Filter<InferSchemaOutput<T>>) {
    return new ReplaceOneQuery(this._collection, this._schema, filter);
  }

  aggregate(pipeline?: PipelineStage<OptionalUnlessRequiredId<InferSchemaOutput<T>>>[]): AggregationPipeline<T> {
    return new AggregationPipeline(this._collection, pipeline);
  }

  watch(pipeline?: PipelineStage<any>[]) {
    return new WatchPipeline(this._collection, pipeline);
  }

  bulkWrite(values: AnyBulkWriteOperation<InferSchemaOutput<T>>[]) {
    return new BulkWriteQuery(this._collection, values);
  }

  distinct(field: keyof InferSchemaOutput<T>, filter?: Filter<InferSchemaOutput<T>>) {
    return new DistinctQuery(this._collection, field, filter);
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
  createIndex(key: IndexDefinitionKey<Partial<InferSchemaOutput<T>>>, options?: IndexDefinitionOptions<InferSchemaOutput<T>>) {
    return this._collection.createIndex(key, options);
  }

  createIndexes(keys: IndexDefinitionKey<Partial<InferSchemaOutput<T>>>[], options?: IndexDefinitionOptions<InferSchemaOutput<T>>) {
    return this._collection.createIndexes(keys.map((key) => ({ key, ...options })), options);
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
export class Query<T extends Schema<any, any>> {
  protected filters: Filter<InferSchemaOutput<T>> = {};
  protected projection: Projection<InferSchemaOutput<T>> = {};
  protected _options: FindOptions = {};

  constructor(
    protected readonly _collection: Collection<InferSchemaOutput<T>>
  ) { }



  select(...fields: (keyof WithId<InferSchemaOutput<T>>)[]): this {
    this.projection = fields.reduce((acc, field) => {
      acc[field] = 1;
      return acc;
    }, {} as Projection<WithId<InferSchemaOutput<T>>>);
    return this;
  }

  omit(...fields: (keyof WithId<InferSchemaOutput<T>>)[]): this {
    this.projection = fields.reduce((acc, field) => {
      acc[field] = 0;
      return acc;
    }, {} as Projection<WithId<InferSchemaOutput<T>>>);
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


export class BaseFindQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    _filters?: Filter<InferSchemaOutput<T>>,
  ) {
    super(_collection);
    Object.assign(this.filters, _filters);
  }

  where(filter: Filter<InferSchemaOutput<T>>): this {
    Object.assign(this.filters, filter);
    return this;
  }

}

export class BaseFindManyQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {

  limit(limit: number): this {
    this._options.limit = limit;
    return this;
  }

  skip(skip: number): this {
    this._options.skip = skip;
    return this;
  }
}


export class BaseMutationQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {
  protected data = {} as OptionalUnlessRequiredId<InferSchemaOutput<T>>;

  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private _schema: T,
    _filters?: Filter<InferSchemaOutput<T>>,
  ) {
    super(_collection, _filters);
  }

  values(data: UpdateFilter<InferSchemaOutput<T>>): this {
    Object.assign(this.data, data);
    // this.data = parseSchema(this._schema, data) as OptionalUnlessRequiredId<InferSchemaOutput<T>>;
    return this;
  }
}

export class BaseUpdateQuery<T extends Schema<any, any>> extends BaseMutationQuery<T> {

  set(values: UpdateFilter<InferSchemaOutput<T>>): this {
    Object.assign(this.data, { $set: values });
    return this;
  }
}

export class BaseInsertQuery<T extends Schema<any, any>> extends Query<T> {
  protected data = {} as OptionalUnlessRequiredId<InferSchemaOutput<T>>;

  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private _schema: T
  ) {
    super(_collection);
  }

  values(data: OptionalUnlessRequiredId<InferSchemaInput<T>>): this {
    this.data = parseSchema(this._schema, data) as OptionalUnlessRequiredId<InferSchemaOutput<T>>;
    return this;
  }
}

export class BaseInsertManyQuery<T extends Schema<any, any>> extends Query<T> {
  protected data = [] as OptionalUnlessRequiredId<InferSchemaOutput<T>>[];

  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private _schema: T
  ) {
    super(_collection);
  }

  values(data: OptionalUnlessRequiredId<InferSchemaInput<T>>[]): this {
    this.data = data.map((value) => parseSchema(this._schema, value) as OptionalUnlessRequiredId<InferSchemaOutput<T>>);
    return this;
  }
}


export class CountQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {
  async exec(): Promise<number> {
    return this._collection.countDocuments(this.filters);
  }
}

export class DistinctQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {

  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private _field: keyof InferSchemaOutput<T>,
    _filters?: Filter<InferSchemaOutput<T>>,
  ) {
    super(_collection);
  }

  async exec(): Promise<any[]> {

    return this._collection.distinct(this._field, this.filters);
  }
}




export class FindQuery<T extends Schema<any, any>> extends BaseFindManyQuery<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>>[]> {
    return this._collection
      .find(this.filters, {
        ...this._options,
        projection: this.projection,
      })
      .toArray();
  }
}

export class FindOneQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOne(this.filters, {
      projection: this.projection,
    });
  }
}

export class FindOneAndDeleteQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {
  protected _options: FindOneAndDeleteOptions = {};

  options(options: FindOneAndDeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOneAndDelete(this.filters, this._options);
  }
}

export class FindOneAndUpdateQuery<T extends Schema<any, any>> extends BaseMutationQuery<T> {
  protected _options: FindOneAndUpdateOptions = {};

  options(options: FindOneAndUpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return await this._collection.findOneAndUpdate(this.filters, this.data, this._options);
  }
}


export class FindOneAndReplaceQuery<T extends Schema<any, any>> extends BaseMutationQuery<T> {
  protected _options: FindOneAndReplaceOptions = {};

  options(options: FindOneAndReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOneAndReplace(this.filters, this.data, this._options);
  }
}

export class InsertOneQuery<T extends Schema<any, any>> extends BaseInsertQuery<T> {
  async exec() {
    const result = await this._collection.insertOne(this.data);
    return { _id: result.insertedId, ...this.data };
  }
}

export class InsertManyQuery<T extends Schema<any, any>> extends BaseInsertManyQuery<T> {
  async exec() {
    const result = await this._collection.insertMany(this.data);
    return this.data.map((data, index) => ({ _id: result.insertedIds[index], ...data }))
  }
}

export class ReplaceOneQuery<T extends Schema<any, any>> extends BaseMutationQuery<T> {
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

export class UpdateOneQuery<T extends Schema<any, any>> extends BaseUpdateQuery<T> {
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

export class UpdateManyQuery<T extends Schema<any, any>> extends BaseUpdateQuery<T> {
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

export class DeleteOneQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {
  protected _options: DeleteOptions = {};

  options(options: DeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteOne(this.filters, this._options);
    return result;
  }
}

export class DeleteManyQuery<T extends Schema<any, any>> extends BaseFindQuery<T> {
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

export class BulkWriteQuery<T extends Schema<any, any>> extends Query<T> {
  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
    private data: AnyBulkWriteOperation<InferSchemaOutput<T>>[]
  ) {
    super(_collection);
  }
  async exec(): Promise<BulkWriteResult<InferSchemaOutput<T>>> {
    return this._collection.bulkWrite(this.data);
  }
}

export class Pipeline<T extends Schema<any, any>> {
  protected pipeline: PipelineStage<
    OptionalUnlessRequiredId<InferSchemaOutput<T>>
  >[] = [];
  protected _options: AggregateOptions = {};

  constructor(protected readonly _collection: Collection<InferSchemaOutput<T>>,
    pipeline?: PipelineStage<OptionalUnlessRequiredId<InferSchemaOutput<T>>>[]) {
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
    stage: PipelineStage<OptionalUnlessRequiredId<InferSchemaOutput<T>>>
  ): this {
    this.pipeline.push(stage);
    return this;
  }

}

export class AggregationPipeline<T extends Schema<any, any>> extends Pipeline<T> {

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

export class WatchPipeline<T extends Schema<any, any>> extends Pipeline<T> {
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
