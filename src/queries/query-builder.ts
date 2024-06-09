import type {
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
    return new InsertQuery(this._collection, parsed);
  }

  find() {
    return new FindQuery(this._collection);
  }

  findOne() {
    return new FindOneQuery(this._collection);
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
}

export type Projection<T> = {
  [K in keyof T]?: 1 | 0;
};

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

// Define a query class for insert operations
export class InsertQuery<T extends Schema<any, any>> extends Query<T> {
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

// Define a query class for deleteOne operations
export class DeleteOneQuery<T extends Schema<any, any>> extends Query<T> {
  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteOne(this.filters, this.options);
    return result;
  }
}

// Define a class to represent an aggregation pipeline
export class AggregationPipeline<T extends Schema<any, any>> {
  private pipeline: PipelineStage[] = [];

  constructor(private readonly _collection: Collection<InferSchemaOutput<T>>) {}

  // Method to add a stage to the aggregation pipeline
  addStage(stage: PipelineStage): this {
    this.pipeline.push(stage);
    return this;
  }

  // Method to execute the aggregation pipeline
  async exec(): Promise<any[]> {
    return this._collection.aggregate(this.pipeline).toArray();
  }
}
