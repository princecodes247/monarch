
# Monarch

<!-- ![Logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/th5xamgrr6se0x5ro4g6.png) -->

**Monarch** is a strong, type-safe Object Document Mapper (ODM) for MongoDB, designed to provide a seamless and efficient way to interact with your MongoDB database in a type-safe manner. Monarch ensures that your data models are strictly enforced, reducing the risk of runtime errors and enhancing code maintainability.


<!-- > Inspired by Drizzle and Mongoose. -->


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Defining Schemas](#defining-schemas)
  <!-- - [Creating and Querying Documents](#creating-and-querying-documents) -->
  <!-- - [Updating Documents](#updating-documents) -->
  <!-- - [Deleting Documents](#deleting-documents) -->
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

```bash
  npm install monarch
```
    
## Quick Start

```typescript
import { boolean, createDatabase, createSchema, number, string } from "monarch";

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

## Usage

```typescript
import { boolean, createDatabase, createSchema, number, string } from "monarch";

```

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
