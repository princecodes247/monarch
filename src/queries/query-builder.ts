import type {
  AnyBulkWriteOperation,
  Collection,
  DeleteResult,
  DropIndexesOptions,
  Filter,
  FindOptions,
  IndexDirection,
  MongoClient,
  OptionalUnlessRequiredId,
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

type IndexDefinitionKey<T> = { [K in keyof T]: IndexDirection};

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

  find() {
    return new FindQuery(this._collection);
  }

  findOne() {
    return new FindOneQuery(this._collection);
  }

  findOneAndDelete() {
    return new FindOneAndDeleteQuery(this._collection);
  }

  findOneAndUpdate() {
    return new FindOneAndUpdateQuery(this._collection);
  }

  findOneAndReplace() {
    return new FindOneAndReplaceQuery(this._collection);
  }

  count() {
    return new CountQuery(this._collection);
  }

  updateOne() {
    return new UpdateOneQuery(this._collection);
  }

  updateMany() {
    return new UpdateManyQuery(this._collection);
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
  createIndex(key: IndexDefinitionKey<Partial<InferSchemaOutput<T>>>, options?: IndexDefinitionOptions<InferSchemaOutput<T>>) {
      return this._collection.createIndex(key, options);
  }

  createIndexes(keys: IndexDefinitionKey<InferSchemaOutput<T>>[], options?: IndexDefinitionOptions<InferSchemaOutput<T>>) {
    return this._collection.createIndexes(keys.map((key) => ({ key, ...options })), options);
}  

  dropIndex(value: keyof InferSchemaOutput<T>) {
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

  async exec(): Promise<any> {
    throw new Error("exec() method must be implemented in subclasses");
  }
}

export class MutationBaseQuery<T extends Schema<any, any>> extends Query<T> {
  protected data = {} as OptionalUnlessRequiredId<InferSchemaOutput<T>>;

  constructor(
    _collection: Collection<InferSchemaOutput<T>>,
  ) {
    super(_collection);
  }
  
  values(values: UpdateFilter<InferSchemaOutput<T>>): this {
    Object.assign(this.data, values);
    return this;
  }
  set(values: UpdateFilter<InferSchemaOutput<T>>): this {
    Object.assign(this.data, {$set: values});
    return this;
  }
}

export class InsertBaseQuery<T extends Schema<any, any>> extends Query<T> {
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

export class InsertManyBaseQuery<T extends Schema<any, any>> extends Query<T> {
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


// Define specific query classes
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

export class FindOneQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOne(this.filters, {
      projection: this.projection,
    });
  }
}

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

export class FindOneAndUpdateQuery<T extends Schema<any, any>> extends MutationBaseQuery<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    
    return await this._collection.findOneAndUpdate(this.filters, this.data, {
      returnDocument: "after"
    });
    
  }
}

export class FindOneAndReplaceQuery<T extends Schema<any, any>> extends MutationBaseQuery<T> {
  async exec(): Promise<WithId<InferSchemaOutput<T>> | null> {
    return this._collection.findOneAndReplace(this.filters, this.data);
  }
}

export class InsertOneQuery<T extends Schema<any, any>> extends InsertBaseQuery<T> {
  async exec() {
    const result = await this._collection.insertOne(this.data);
    return { _id: result.insertedId, ...this.data };
  }
}

export class InsertManyQuery<T extends Schema<any, any>> extends InsertManyBaseQuery<T> {
  async exec() {
    const result = await this._collection.insertMany(this.data);
    return result;
  }
}

export class ReplaceOneQuery<T extends Schema<any, any>> extends MutationBaseQuery<T> {
  async exec(): Promise<boolean> {
    const result = await this._collection.replaceOne(
      this.filters,
      this.data,
      this.options
    );
    return !!result.modifiedCount;
  }
}

export class UpdateOneQuery<T extends Schema<any, any>> extends MutationBaseQuery<T> {
  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateOne(
      this.filters,
      this.data,
      this.options
    );
    return !!result.modifiedCount;
  }
}

export class UpdateManyQuery<T extends Schema<any, any>> extends MutationBaseQuery<T> {
  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateMany(
      this.filters,
      this.data,
      this.options
    );
    return !!result.modifiedCount;
  }
}

export class DeleteOneQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteOne(this.filters, this.options);
    return result;
  }
}

export class DeleteManyQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteMany(
      this.filters,
      this.options
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
