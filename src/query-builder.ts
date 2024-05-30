import type {
  Collection,
  DeleteResult,
  Document,
  Filter,
  InferIdType,
  OptionalUnlessRequiredId,
  UpdateResult,
  WithId,
} from "mongodb";
import type { CreatedSchema, SchemaDefinition } from "./types";

export type Projection<T> = {
  [K in keyof T]?: 1 | 0;
};

// Define a base query class
export class BaseQuery<T extends SchemaDefinition> {
  protected filters: Filter<T> = {};
  protected projection: Projection<T> = {};
  protected options: any = {};

  constructor(protected readonly _collection: Collection<T>) {}

  where(filter: Filter<T>): this {
    Object.assign(this.filters, filter);
    return this;
  }

  select(projection: Projection<WithId<T>>): this {
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
export class FindQuery<T extends Document> extends BaseQuery<T> {
  async exec(): Promise<WithId<T>[]> {
    return this._collection
      .find(this.filters, {
        ...this.options,
        projection: this.projection,
      })
      .toArray();
  }
}

// Define a query class for findOne operations
export class FindOneQuery<T extends Document> extends BaseQuery<T> {
  exec(): Promise<WithId<T> | null> {
    return this._collection.findOne(this.filters, {
      projection: this.projection,
    });
  }
}

// Define a query class for insert operations
export class InsertQuery<T extends SchemaDefinition> extends BaseQuery<T> {
  constructor(
    collection: Collection<T>,
    private readonly document: CreatedSchema<T>
  ) {
    super(collection);
  }

  async exec(): Promise<{
    _id: InferIdType<T>;
  }> {
    const value: OptionalUnlessRequiredId<any> = this.document;
    const result = await this._collection.insertOne(value);
    return { _id: result.insertedId, ...value };
  }
}

// Define a query class for updateOne operations
export class UpdateOneQuery<T extends Document> extends BaseQuery<T> {
  constructor(
    collection: Collection<T>,
    private readonly update: UpdateOneQuery<T>
  ) {
    super(collection);
  }

  async exec(): Promise<boolean> {
    const result: UpdateResult = await this._collection.updateOne(
      this.filters,
      this.update,
      this.options
    );
    return !!result.modifiedCount;
  }
}

// Define a query class for deleteOne operations
export class DeleteOneQuery<T extends Document> extends BaseQuery<T> {
  async exec(): Promise<boolean> {
    const result: DeleteResult = await this._collection.deleteOne(
      this.filters,
      this.options
    );
    return !!result.deletedCount;
  }
}

export class QueryBuilder<T extends SchemaDefinition> {
  private readonly _collection: Collection<any>;
  private _schema: T;

  constructor(collection: Collection, schema: T) {
    this._collection = collection;
    this._schema = schema;
  }

  insert(document: CreatedSchema<T>): InsertQuery<T> {
    return new InsertQuery(this._collection, document);
  }

  find(): FindQuery<CreatedSchema<T>> {
    return new FindQuery<CreatedSchema<T>>(this._collection);
  }
}
