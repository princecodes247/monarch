import type {
  AbstractCursorOptions,
  DropIndexesOptions,
  EstimatedDocumentCountOptions,
  Filter,
  IndexDirection,
  IndexInformationOptions,
  IndexSpecification,
  MongoClient,
  Collection as MongoDBCollection,
  OperationOptions,
  OptionalUnlessRequiredId,
  RenameOptions,
  SearchIndexDescription
} from "mongodb";
import { MonarchError } from "../errors";
import { AnySchema } from "../schema/schema";
import {
  InferSchemaData,
  InferSchemaOutput
} from "../schema/type-helpers";
import { BulkWriteQuery } from "./queries/bulk-write";

import { InsertManyQuery } from "./queries/insert-many";
import { AggregationPipeline, WatchPipeline } from "./queries/pipeline";
import { PipelineStage } from "./queries/pipeline/pipeline-stage";

import { CountQuery } from "./queries/count";
import { DeleteManyQuery } from "./queries/delete-many";
import { DeleteOneQuery } from "./queries/delete-one";
import { DistinctQuery } from "./queries/distinct";
import { FindQuery } from "./queries/find";
import { FindOneQuery } from "./queries/find-one";
import { FindOneAndDeleteQuery } from "./queries/find-one-and-delete";
import { FindOneAndReplaceQuery } from "./queries/find-one-and-replace";
import { FindOneAndUpdateQuery } from "./queries/find-one-and-update";
import { InsertOneQuery } from "./queries/insert-one";
import { ReplaceOneQuery } from "./queries/replace-one";
import { UpdateManyQuery } from "./queries/update-many";
import { UpdateOneQuery } from "./queries/update-one";


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


export class Collection<T extends AnySchema> {
  private _collection: MongoDBCollection<InferSchemaData<T>>;

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

  distinct(field: keyof InferSchemaOutput<T>, filter?: Filter<InferSchemaData<T>>) {
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

  raw() {
    return this._collection;
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

