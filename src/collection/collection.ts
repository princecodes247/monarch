import { AggregateOptions, AggregationCursor, AnyBulkWriteOperation, BSONSerializeOptions, BulkWriteOptions, BulkWriteResult, ChangeStream, ChangeStreamDocument, ChangeStreamOptions, Collection, CountDocumentsOptions, CountOptions, CreateIndexesOptions, DeleteOptions, DeleteResult, DistinctOptions, Document, DropCollectionOptions, DropIndexesOptions, EstimatedDocumentCountOptions, FindCursor, FindOneAndDeleteOptions, FindOneAndReplaceOptions, FindOneAndUpdateOptions, FindOptions, Flatten, Hint, IndexDescription, IndexDescriptionCompact, IndexDescriptionInfo, IndexInformationOptions, IndexSpecification, InsertManyResult, InsertOneOptions, InsertOneResult, ListIndexesCursor, ListIndexesOptions, ListSearchIndexesCursor, ListSearchIndexesOptions, ModifyResult, OperationOptions, OrderedBulkOperation, ReadConcern, ReadPreference, RenameOptions, ReplaceOptions, SearchIndexDescription, UnorderedBulkOperation, UpdateOptions, UpdateResult, WriteConcern } from "mongodb";
import { WithOptionalId, WithoutId, WithRequiredId } from "../type-helpers";
import { UpdateFilterQuery } from "./queries/base";
import { FilterQuery } from "./queries/expressions";

export interface MongoDBCollection<TSchema extends Document = Document> {
    get dbName(): string;
    get collectionName(): string;
    get namespace(): string;
    get readConcern(): ReadConcern | undefined;
    get readPreference(): ReadPreference | undefined;
    get bsonOptions(): BSONSerializeOptions;
    get writeConcern(): WriteConcern | undefined;
    get hint(): Hint | undefined;
    set hint(v: Hint | undefined);
    insertOne(doc: WithOptionalId<TSchema>, options?: InsertOneOptions): Promise<InsertOneResult<TSchema>>;
    insertMany(docs: WithOptionalId<TSchema>[], options?: BulkWriteOptions): Promise<InsertManyResult<TSchema>>;
    bulkWrite(operations: AnyBulkWriteOperation<TSchema>[], options?: BulkWriteOptions): Promise<BulkWriteResult>;
    updateOne(filter: FilterQuery<TSchema>, update: UpdateFilterQuery<TSchema> | Document[], options?: UpdateOptions): Promise<UpdateResult<TSchema>>;
    replaceOne(filter: FilterQuery<TSchema>, replacement: WithoutId<TSchema>, options?: ReplaceOptions): Promise<UpdateResult<TSchema> | Document>;
    updateMany(filter: FilterQuery<TSchema>, update: UpdateFilterQuery<TSchema> | Document[], options?: UpdateOptions): Promise<UpdateResult<TSchema>>;
    deleteOne(filter?: FilterQuery<TSchema>, options?: DeleteOptions): Promise<DeleteResult>;
    deleteMany(filter?: FilterQuery<TSchema>, options?: DeleteOptions): Promise<DeleteResult>;
    rename(newName: string, options?: RenameOptions): Promise<Collection>;
    drop(options?: DropCollectionOptions): Promise<boolean>;
    findOne(): Promise<WithRequiredId<TSchema> | null>;
    findOne(filter: FilterQuery<TSchema>): Promise<WithRequiredId<TSchema> | null>;
    findOne(filter: FilterQuery<TSchema>, options: FindOptions): Promise<WithRequiredId<TSchema> | null>;
    findOne<T = TSchema>(): Promise<T | null>;
    findOne<T = TSchema>(filter: FilterQuery<TSchema>): Promise<T | null>;
    findOne<T = TSchema>(filter: FilterQuery<TSchema>, options?: FindOptions): Promise<T | null>;
    find(): FindCursor<WithRequiredId<TSchema>>;
    find(filter: FilterQuery<TSchema>, options?: FindOptions): FindCursor<WithRequiredId<TSchema>>;
    find<T extends Document>(filter: FilterQuery<TSchema>, options?: FindOptions): FindCursor<T>;
    options(options?: OperationOptions): Promise<Document>;
    isCapped(options?: OperationOptions): Promise<boolean>;
    createIndex(indexSpec: IndexSpecification, options?: CreateIndexesOptions): Promise<string>;
    createIndexes(indexSpecs: IndexDescription[], options?: CreateIndexesOptions): Promise<string[]>;
    dropIndex(indexName: string, options?: DropIndexesOptions): Promise<Document>;
    dropIndexes(options?: DropIndexesOptions): Promise<boolean>;
    listIndexes(options?: ListIndexesOptions): ListIndexesCursor;
    indexExists(indexes: string | string[], options?: ListIndexesOptions): Promise<boolean>;
    indexInformation(options: IndexInformationOptions & {
        full: true;
    }): Promise<IndexDescriptionInfo[]>;
    indexInformation(options: IndexInformationOptions & {
        full?: false;
    }): Promise<IndexDescriptionCompact>;
    indexInformation(options: IndexInformationOptions): Promise<IndexDescriptionCompact | IndexDescriptionInfo[]>;
    indexInformation(): Promise<IndexDescriptionCompact>;
    estimatedDocumentCount(options?: EstimatedDocumentCountOptions): Promise<number>;
    countDocuments(filter?: FilterQuery<TSchema>, options?: CountDocumentsOptions): Promise<number>;
    distinct<Key extends keyof WithRequiredId<TSchema>>(key: Key): Promise<Array<Flatten<WithRequiredId<TSchema>[Key]>>>;
    distinct<Key extends keyof WithRequiredId<TSchema>>(key: Key, filter: FilterQuery<TSchema>): Promise<Array<Flatten<WithRequiredId<TSchema>[Key]>>>;
    distinct<Key extends keyof WithRequiredId<TSchema>>(key: Key, filter: FilterQuery<TSchema>, options: DistinctOptions): Promise<Array<Flatten<WithRequiredId<TSchema>[Key]>>>;
    distinct(key: string): Promise<any[]>;
    distinct(key: string, filter: FilterQuery<TSchema>): Promise<any[]>;
    distinct(key: string, filter: FilterQuery<TSchema>, options: DistinctOptions): Promise<any[]>;
    indexes(options: IndexInformationOptions & {
        full?: true;
    }): Promise<IndexDescriptionInfo[]>;
    indexes(options: IndexInformationOptions & {
        full: false;
    }): Promise<IndexDescriptionCompact>;
    indexes(options: IndexInformationOptions): Promise<IndexDescriptionCompact | IndexDescriptionInfo[]>;
    indexes(options?: ListIndexesOptions): Promise<IndexDescriptionInfo[]>;
    findOneAndDelete(filter: FilterQuery<TSchema>, options: FindOneAndDeleteOptions & {
        includeResultMetadata: true;
    }): Promise<ModifyResult<TSchema>>;
    findOneAndDelete(filter: FilterQuery<TSchema>, options: FindOneAndDeleteOptions & {
        includeResultMetadata: false;
    }): Promise<WithRequiredId<TSchema> | null>;
    findOneAndDelete(filter: FilterQuery<TSchema>, options: FindOneAndDeleteOptions): Promise<WithRequiredId<TSchema> | null>;
    findOneAndDelete(filter: FilterQuery<TSchema>): Promise<WithRequiredId<TSchema> | null>;
    findOneAndReplace(filter: FilterQuery<TSchema>, replacement: WithoutId<TSchema>, options: FindOneAndReplaceOptions & {
        includeResultMetadata: true;
    }): Promise<ModifyResult<TSchema>>;
    findOneAndReplace(filter: FilterQuery<TSchema>, replacement: WithoutId<TSchema>, options: FindOneAndReplaceOptions & {
        includeResultMetadata: false;
    }): Promise<WithRequiredId<TSchema> | null>;
    findOneAndReplace(filter: FilterQuery<TSchema>, replacement: WithoutId<TSchema>, options: FindOneAndReplaceOptions): Promise<WithRequiredId<TSchema> | null>;
    findOneAndReplace(filter: FilterQuery<TSchema>, replacement: WithoutId<TSchema>): Promise<WithRequiredId<TSchema> | null>;
    findOneAndUpdate(filter: FilterQuery<TSchema>, update: UpdateFilterQuery<TSchema>, options: FindOneAndUpdateOptions & {
        includeResultMetadata: true;
    }): Promise<ModifyResult<TSchema>>;
    findOneAndUpdate(filter: FilterQuery<TSchema>, update: UpdateFilterQuery<TSchema>, options: FindOneAndUpdateOptions & {
        includeResultMetadata: false;
    }): Promise<WithRequiredId<TSchema> | null>;
    findOneAndUpdate(filter: FilterQuery<TSchema>, update: UpdateFilterQuery<TSchema>, options: FindOneAndUpdateOptions): Promise<WithRequiredId<TSchema> | null>;
    findOneAndUpdate(filter: FilterQuery<TSchema>, update: UpdateFilterQuery<TSchema>): Promise<WithRequiredId<TSchema> | null>;
    aggregate<T extends Document = Document>(pipeline?: Document[], options?: AggregateOptions): AggregationCursor<T>;
    watch<TLocal extends Document = TSchema, TChange extends Document = ChangeStreamDocument<TLocal>>(pipeline?: Document[], options?: ChangeStreamOptions): ChangeStream<TLocal, TChange>;
    initializeUnorderedBulkOp(options?: BulkWriteOptions): UnorderedBulkOperation;
    initializeOrderedBulkOp(options?: BulkWriteOptions): OrderedBulkOperation;
    count(filter?: FilterQuery<TSchema>, options?: CountOptions): Promise<number>;
    listSearchIndexes(options?: ListSearchIndexesOptions): ListSearchIndexesCursor;
    listSearchIndexes(name: string, options?: ListSearchIndexesOptions): ListSearchIndexesCursor;
    createSearchIndex(description: SearchIndexDescription): Promise<string>;
    createSearchIndexes(descriptions: SearchIndexDescription[]): Promise<string[]>;
    dropSearchIndex(name: string): Promise<void>;
    updateSearchIndex(name: string, definition: Document): Promise<void>;
}