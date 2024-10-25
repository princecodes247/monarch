
# API Docs

### insert()

Inserts a new document into the collection.

Arguments:
- None

Return Type:
- Promise\<InsertOneWriteOpResult\<InferSchemaData\<T\>\>\>

Callable Methods:
- `exec()`: Executes the insert operation.

Summary: Inserts a single document into the collection.

### insertOne()

Inserts a single document into the collection.

Arguments:
- None

Return Type:
- Promise\<InsertOneWriteOpResult\<InferSchemaData\<T\>\>\>

Callable Methods:
- `exec()`: Executes the insert operation.

Summary: Inserts a single document into the collection.

### insertMany()

Inserts multiple documents into the collection.

Arguments:
- None

Return Type:
- Promise\<InsertWriteOpResult\<InferSchemaData\<T\>\>\>

Callable Methods:
- `exec()`: Executes the insert operation.

Summary: Inserts multiple documents into the collection.

### find()

Retrieves documents from the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<InferSchemaData\<T\>\[\]\>

Callable Methods:
- `where()`: Filters the documents based on a specified condition.
- `exec()`: Executes the find operation.
- `limit()`: Limits the number of documents returned.
- `skip()`: Skips a specified number of documents.
- `sort()`: Sorts the documents by a specified field.

Summary: Retrieves documents from the collection based on a filter.

### findOne()

Retrieves a single document from the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<InferSchemaData\<T\> | null\>

Callable Methods:
- `where()`: Filters the documents based on a specified condition.
- `exec()`: Executes the find operation.

Summary: Retrieves a single document from the collection based on a filter.

### findOneAndDelete()

Retrieves a single document from the collection and deletes it.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<FindAndModifyWriteOpResultObject\<InferSchemaData\<T\>\>\>

Callable Methods:
- `exec()`: Executes the find and delete operation.

Summary: Retrieves a single document from the collection based on a filter and deletes it.

### findOneAndUpdate()

Retrieves a single document from the collection, updates it, and returns the updated document.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>
- update: UpdateFilter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<FindAndModifyWriteOpResultObject\<InferSchemaData\<T\>\>\>

Callable Methods:
- `exec()`: Executes the find and update operation.

Summary: Retrieves a single document from the collection based on a filter, updates it, and returns the updated document.

### findOneAndReplace()

Retrieves a single document from the collection, replaces it, and returns the new document.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>
- replacement: InferSchemaData\<T\>

Return Type:
- Promise\<FindAndModifyWriteOpResultObject\<InferSchemaData\<T\>\>\>

Callable Methods:
- `exec()`: Executes the find and replace operation.

Summary: Retrieves a single document from the collection based on a filter, replaces it, and returns the new document.

### count()

Counts the number of documents in the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<number\>

Callable Methods:
- `exec()`: Executes the count operation.

Summary: Counts the number of documents in the collection based on a filter.

### updateOne()

Updates a single document in the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>
- update: UpdateFilter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<UpdateWriteOpResult\>

Callable Methods:
- `exec()`: Executes the update operation.

Summary: Updates a single document in the collection based on a filter.

### updateMany()

Updates multiple documents in the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>
- update: UpdateFilter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<UpdateWriteOpResult\>

Callable Methods:
- `exec()`: Executes the update operation.

Summary: Updates multiple documents in the collection based on a filter.

### deleteOne()

Deletes a single document from the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<DeleteWriteOpResultObject\>

Callable Methods:
- `exec()`: Executes the delete operation.

Summary: Deletes a single document from the collection based on a filter.

### deleteMany()

Deletes multiple documents from the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<DeleteWriteOpResultObject\>

Callable Methods:
- `exec()`: Executes the delete operation.

Summary: Deletes multiple documents from the collection based on a filter.

### replaceOne()

Replaces a single document in the collection.

Arguments:
- filter: Filter\<InferSchemaData\<T\>\>
- replacement: InferSchemaData\<T\>

Return Type:
- Promise\<ReplaceWriteOpResult\>

Callable Methods:
- `exec()`: Executes the replace operation.

Summary: Replaces a single document in the collection based on a filter.

### aggregate()

Performs aggregation operations on the collection.

Arguments:
- pipeline: PipelineStage\<OptionalUnlessRequiredId\<InferSchemaData\<T\>\>\[\]

Return Type:
- AggregationCursor\<InferSchemaData\<T\>\>

Callable Methods:
- `exec()`: Executes the aggregation operation.
- `allowDiskUse()`: Allows the aggregation operation to use disk storage.
- `cursor()`: Returns a cursor for the aggregation operation.

Summary: Performs aggregation operations on the collection using a pipeline.

### watch()

Watches for changes in the collection.

Arguments:
- pipeline: PipelineStage\<any\>\[\]

Return Type:
- ChangeStream\<InferSchemaData\<T\>\>

Callable Methods:
- `exec()`: Executes the watch operation.
- `on()`: Attaches a listener to the change stream.

Summary: Watches for changes in the collection using a pipeline.

### bulkWrite()

Performs bulk write operations on the collection.

Arguments:
- None

Return Type:
- Promise\<BulkWriteOpResultObject\>

Callable Methods:
- `exec()`: Executes the bulk write operation.

Summary: Performs bulk write operations on the collection.

### distinct()

Finds the distinct values for a specified field in the collection.

Arguments:
- field: keyof InferSchemaOutput\<T\>
- filter: Filter\<InferSchemaData\<T\>\>

Return Type:
- Promise\<InferSchemaOutput\<T\>\[\]\>

Callable Methods:
- `exec()`: Executes the distinct operation.

Summary: Finds the distinct values for a specified field in the collection based on a filter.

### drop()

Drops the collection.

Arguments:
- None

Return Type:
- Promise\<void\>

Callable Methods:
- `exec()`: Executes the drop operation.

Summary: Drops the collection.

### estimatedDocumentCount()

Estimates the number of documents in the collection.

Arguments:
- options: EstimatedDocumentCountOptions

Return Type:
- Promise\<number\>

Callable Methods:
- `exec()`: Executes the estimated document count operation.

Summary: Estimates the number of documents in the collection.

### isCapped()

Checks if the collection is capped.

Arguments:
- None

Return Type:
- Promise\<boolean\>

Callable Methods:
- `exec()`: Executes the is capped operation.

Summary: Checks if the collection is capped.

### options()

Gets the options of the collection.

Arguments:
- options: OperationOptions

Return Type:
- Promise\<any\>

Callable Methods:
- `exec()`: Executes the options operation.

Summary: Gets the options of the collection.

### rename()

Renames the collection.

Arguments:
- newName: string
- options: RenameOptions

Return Type:
- Promise\<MongoClient\>

Callable Methods:
- `exec()`: Executes the rename operation.

Summary: Renames the collection.

### raw()

Returns the raw MongoDB collection.

Arguments:
- None

Return Type:
- MongoDBCollection\<InferSchemaData\<T\>\>

Callable Methods:
- Various MongoDB collection methods.

Summary: Returns the raw MongoDB collection.

### createIndex()

Creates an index on the collection.

Arguments:
- key: IndexDefinitionKey\<Partial\<InferSchemaData\<T\>\>\>
- options: IndexDefinitionOptions\<InferSchemaData\<T\>\>

Return Type:
- Promise\<string\>

Callable Methods:
- `exec()`: Executes the create index operation.

Summary: Creates an index on the collection.

### createIndexes()

Creates multiple indexes on the collection.

Arguments:
- keys: IndexDefinitionKey\<Partial\<InferSchemaData\<T\>\>\[\]
- options: IndexDefinitionOptions\<InferSchemaData\<T\>\>

Return Type:
- Promise\<string\[\]\>

Callable Methods:
- `exec()`: Executes the create indexes operation.

Summary: Creates multiple indexes on the collection.

### dropIndex()

Drops an index from the collection.

Arguments:
- value: string

Return Type:
- Promise\<string\>

Callable Methods:
- `exec()`: Executes the drop index operation.

Summary: Drops an index from the collection.

### dropIndexes()

Drops all indexes from the collection.

Arguments:
- options: DropIndexesOptions

Return Type:
- Promise\<string\[\]\>

Callable Methods:
- `exec()`: Executes the drop indexes operation.

Summary: Drops all indexes from the collection.

### listIndexes()

Lists all indexes on the collection.

Arguments:
- None

Return Type:
- CommandCursor\<IndexInformation\[\]\>

Callable Methods:
- `exec()`: Executes the list indexes operation.
- `forEach()`: Iterates over the index information.

Summary: Lists all indexes on the collection.

### indexExists()

Checks if an index exists on the collection.

Arguments:
- name: string
- options: AbstractCursorOptions

Return Type:
- Promise\<boolean\>

Callable Methods:
- `exec()`: Executes the index exists operation.

Summary: Checks if an index exists on the collection.

### indexInformation()

Gets information about the indexes on the collection.

Arguments:
- options: IndexInformationOptions & { full?: boolean; }

Return Type:
- Promise\<IndexInformation\[\]\>

Callable Methods:
- `exec()`: Executes the index information operation.
- `forEach()`: Iterates over the index information.

Summary: Gets information about the indexes on the collection.

### createSearchIndex()

Creates a search index on the collection.

Arguments:
- description: SearchIndexDescription

Return Type:
- Promise\<string\>

Callable Methods:
- `exec()`: Executes the create search index operation.

Summary: Creates a search index on the collection.

### createSearchIndexes()

Creates multiple search indexes on the collection.

Arguments:
- descriptions: SearchIndexDescription\[\]

Return Type:
- Promise\<string\[\]\>

Callable Methods:
- `exec()`: Executes the create search indexes operation.

Summary: Creates multiple search indexes on the collection.

### dropSearchIndex()

Drops a search index from the collection.

Arguments:
- name: string

Return Type:
- Promise\<string\>

Callable Methods:
- `exec()`: Executes the drop search index operation.

Summary: Drops a search index from the collection.

### listSearchIndexes()

Lists all search indexes on the collection.

Arguments:
- None

Return Type:
- CommandCursor\<SearchIndexInformation\[\]\>

Callable Methods:
- `exec()`: Executes the list search indexes operation.
- `forEach()`: Iterates over the search index information.

Summary: Lists all search indexes on the collection.

### updateSearchIndex()

Updates a search index on the collection.

Arguments:
- name: string
- description: SearchIndexDescription

Return Type:
- Promise\<string\>

Callable Methods:
- `exec()`: Executes the update search index operation.

Summary: Updates a search index on the collection.




## Roadmap

- Additional schema modifiers
- Full Schema validation

## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.

## Authors

- [@princecodes247](https://www.github.com/princecodes247)
- [@eriicafes](https://www.github.com/eriicafes)

## License

[MIT](https://choosealicense.com/licenses/mit/)
