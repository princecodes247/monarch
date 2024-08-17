
# Monarch ORM

<!-- ![Logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/th5xamgrr6se0x5ro4g6.png) -->

**Monarch ORM** is a type-safe ORM for MongoDB, designed to provide a seamless and efficient way to interact with your MongoDB database in a type-safe manner. Monarch ensures that your data models are strictly enforced, reducing the risk of runtime errors and enhancing code maintainability.


<!-- > Inspired by Drizzle and Mongoose. -->


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Quick Start](#quick-start)
  - [Defining Schemas](#defining-schemas)
  - [Connecting to the Database](#connecting-to-the-database)
  - [Inserting Documents](#inserting-documents)
  - [Querying Documents](#querying-documents)
  - [Updating Documents](#updating-documents)
  - [Deleting Documents](#deleting-documents)
- [Types](#types)
  - [Primitives](#primitives)
  - [Literals](#literals)
  - [Objects](#objects)
  - [Records](#records)
  - [Arrays](#arrays)
  - [Tuples](#tuples)
  - [Tagged Union](#tagged-union)
<!-- - [Type Safety](#type-safety) -->
<!-- - [Configuration](#configuration) -->
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## Features

- **Strongly Typed:** Ensures type safety across your MongoDB operations.
- **Easy Integration:** Simple setup and configuration.
- **Powerful Schema Modifiers:** Define schemas with optional and required fields.
- **Intuitive API:** Designed to be easy to use and understand.



## Installation

NPM:
```bash
  npm install monarch-orm
```

Or Yarn:
```bash
  yarn add monarch-orm
```
    
## Basic Usage

```typescript
import { boolean, createDatabase, createSchema, number, string } from "monarch-orm";

 const UserSchema = createSchema("users", {
      name: string().nullable(),
      email: string().lowercase().optional(),
      age: number().optional().default(10),
      isVerified: boolean(),
    });

    const { collections } = createDatabase(client, {
      users: UserSchema,
    });

    const newUser = await collections.users
      .insert()
      .values({
        name: "anon",
        email: "anon@gmail.com",
        age: 0,
        isVerified: true,
      })
      .exec();

    const users = await collections.users.find().where({}).exec();
```

## Quick Start

### Defining Schemas and connecting to the database

Use the createSchema function to define the structure of your model. Specify the fields and their types, using the available types and modifiers.

```typescript
const UserSchema = createSchema("users", {
  name: string(),
  isVerified: boolean(),
});
```

Create a database instance using any client you deem fit and drop it into the createDatabase function

Or you can use the built-in createClient function.

Then you pass your schemas to the second arguement

```typescript
const { collections } = createDatabase(client, {
  users: UserSchema,
});
```

### Inserting Documents
You can insert new documents into your collection using the insert method. Ensure that the data conforms to the defined schema.

Example: Inserting a new user

```typescript
const newUser = await collections.users
  .insert()
  .values({
    name: "Alice",
    email: "alice@example.com",
    age: 25,
    isVerified: true,
  })
  .exec();
```

### Querying Documents
Retrieve documents from your collection using the find or findOne methods.

Example: Querying all users

```typescript
const users = await collections.users.find().where({}).exec();
console.log(users);

// Or just...
const users = await collections.users.find({}).exec();
console.log(users);


// For finding one

const user = await collections.users.find().where({
  name: "Alice"
}).exec();
console.log(users);

// Or...
const user = await collections.users.findOne({
  name: "Alice"
}).exec();
console.log(users);

```

### Updating Documents
Update documents in your collection using the update method. You can update a single document or multiple documents based on a filter.

Example: Updating a single user's email

```typescript
const updatedUser = await collections.users
  .updateOne()
  .set({
    email: "alice.updated@example.com",
  })
  .where({
    name: "Alice",
  })
  .exec();
console.log(updatedUser);
```

Example: Updating multiple users' isVerified field

```typescript
const updatedUsers = await collections.users
  .updateMany()
  .set({
    isVerified: true,
  })
  .where({
    isVerified: false,
  })
  .exec();
console.log(updatedUsers);
```

Note: The update method returns the number of documents updated.

### Alternative setup
You can also decentralize the models

```typescript
const { db } = createDatabase(client);

const UserSchema = createSchema("users", {
  name: string(),
  isVerified: boolean(),
});

const UserModel = db(UserSchema);
export default UserModel;
```

And use it like this

```typescript
const user = await UserModel.findOne({
  name: "Alice"
}).exec();
console.log(users);
```


## Types

### Primitives

#### String - string()

Defines a field that accepts string values.

```typescript
const UserSchema = createSchema("users", {
  name: string().required(),
});
```

 - `.lowercase()`: Transforms the value to lowercase before storing.
 - `.uppercase()`: Transforms the value to uppercase before storing.

```typescript
const UserSchema = createSchema("users", {
  name: string().lowercase(),
});
```

#### Number - number()

Defines a field that accepts numeric values.

```typescript
const UserSchema = createSchema("users", {
  age: number().optional(),
});
```

#### Boolean - boolean()

Defines a field that accepts boolean values (true or false).

```typescript
const UserSchema = createSchema("users", {
  isVerified: boolean(),
});
```

#### Date - date()

Defines a field that accepts JavaScript Date objects.

```typescript
const UserSchema = createSchema("users", {
  birthDate: date(),
});
```

#### Date String - dateString()
Defines a field that accepts date strings in ISO format.

```typescript
const UserSchema = createSchema("users", {
  registrationDate: dateString(),
});
```

#### General Modifiers

 - `.nullable()`: Allows the field to accept null values.
 - `.default()`: Sets a default value if none is provided.
 - `.optional()`: Makes the field optional, allowing it to be omitted.

### Literals


The `literal()` type allows you to define a schema with fixed possible values, similar to enums in TypeScript. This is useful for enforcing specific, predefined values for a field.

```typescript
  const UserRoleSchema = createSchema("userRoles", {
  role: literal("admin", "moderator", "customer"),
});

const user = {
  role: "admin", // Valid
};

// Invalid example will throw a type error
const invalidUser = {
  role: "guest", // Error: Type '"guest"' is not assignable to type '"admin" | "moderator" | "customer"'
};

```

### Objects

```typescript
 
// all properties are required by default
const UserSchema = object({
  name: string(),
  age: number(),
});

// extract the inferred type like this
type User = InferSchemaInput<typeof UserSchema>;

// equivalent to:
type User = {
  name: string;
  age: number;
};
```


### Records

A `record()` allows you to define a flexible schema where each user can have a varying number of subjects and grades without needing to define a fixed schema for each subject.

```typescript
 
// Define the User schema with a record for grades
const UserSchema = createSchema("users", {
  name: string().required(),
  email: string().required(),
  grades: record(number()), // Each subject will have a numeric grade
});


// Example of inserting a user with grades
const { collections } = createDatabase(client, {
  users: UserSchema,
});

// Inserting a new user with grades for different subjects
const newUser = await collections.users
  .insert()
  .values({
    name: "Alice",
    email: "alice@example.com",
    grades: {
      math: 90,
      science: 85,
      history: 88,
    },
  })
  .exec();

// Querying the user to retrieve grades
const user = await collections.users.findOne().where({ email: "alice@example.com" }).exec();
console.log(user.grades); 
// Output: { math: 90, science: 85, history: 88 }
```

### Arrays

```typescript
 
// For Example
const ResultSchema = object({
  name: string(),
  scores: array(number()),
});

// extract the inferred type like this
type Result = InferSchemaInput<typeof ResultSchema>;

// equivalent to:
type Result = {
  name: string;
  scores: number[];
};
```

### Tuples

Unlike arrays, A `tuple()` has a fixed number of elements but each element can have a different type.

```typescript
 
// all properties are required by default
const ControlSchema = object({
  location: tuple([number(), number()]),
});

// extract the inferred type like this
type Control = InferSchemaInput<typeof ControlSchema>;

// equivalent to:
type Control = {
  location: [number, number];
};
```

### Tagged Union

The `taggedUnion()` allows you to define a schema for related types, each with its own structure, distinguished by a common "tag" field. This is useful for representing variable types in a type-safe manner.

```typescript - taggedUnion()

// You need:
// - a tag: A string identifying the type
// value: An object containing specific fields for that type.

const NotificationSchema = createSchema("notifications", {
  notification: taggedUnion({
    email: object({
      subject: string(),
      body: string(),
    }),
    sms: object({
      phoneNumber: string(),
      message: string(),
    }),
    push: object({
      title: string(),
      content: string(),
    }),
  }),
});

const notification = ;
await collections.notifications.insert().values({ notification: {
  tag: "email",
  value: {
    subject: "Welcome!",
    body: "Thank you for joining us.",
  },
} }).exec();
```

## API Docs

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
