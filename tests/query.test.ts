import { MongoClient } from "mongodb";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { boolean, createDatabase, createSchema, number, string } from "../src";

import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
const client = new MongoClient(uri);

const mockUsers = [
  {
    name: "anon",
    email: "anon@gmail.com",
    age: 17,
    isVerified: true,
  },
  {
    name: "anon1",
    email: "anon1@gmail.com",
    age: 20,
    isVerified: false,
  },
  {
    name: "anon2",
    email: "anon2@gmail.com",
    age: 25,
    isVerified: true,
  },
]

const UserSchema = createSchema("users", {
  name: string().optional(),
  email: string().lowercase().optional(),
  age: number().optional().default(10),
  isVerified: boolean().default(false),
});

const { collections, db } = createDatabase(client, {
  users: UserSchema,
});

describe("Query methods Tests", () => {

  beforeAll(async () => {
    await client.connect();
  });

  afterEach(async () => {
    await collections.users.dropIndexes();
    await collections.users.deleteMany({}).exec();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it("inserts one document", async () => {
    const newUser1 = await collections.users
      .insert()
      .values(mockUsers[0])
      .exec();

    expect(newUser1).not.toBe(null);

    const newUser2 = await collections.users
      .insertOne()
      .values(mockUsers[0])
      .exec();

    expect(newUser2).not.toBe(null);

    // Test edge case: Insert empty document
    const emptyUser = await collections.users
      .insert()
      .values({})
      .exec();

    expect(emptyUser).not.toBe(null);
    expect(emptyUser.age).toBe(10); // Should use default value

    // TODO: Write Test edge case: Insert document with null values

    //   const nullUser = await collections.users
    //   .insert()
    //   .values({
    //     name: null,
    //     email: null,
    //     age: null,
    //     isVerified: false
    //   })
    //   .exec();

    // expect(nullUser).not.toBe(null);
    // expect(nullUser.name).toBe(null);
    // expect(nullUser.email).toBe(null);
    // expect(nullUser.age).toBe(null);
    // expect(nullUser.isVerified).toBe(false);

    // Test edge case: Insert document with invalid email (should be lowercase)
    const invalidEmailUser = await collections.users
      .insert()
      .values({
        name: "Test",
        email: "TEST@EXAMPLE.COM",
        age: 30,
        isVerified: true
      })
      .exec();

    expect(invalidEmailUser).not.toBe(null);
    expect(invalidEmailUser.email).toBe("test@example.com");

    // Test edge case: Insert document with extra fields
    const extraFieldsUser = await collections.users
      .insert()
      .values({
        name: "Extra",
        email: "extra@example.com",
        age: 40,
        isVerified: true,
        extraField: "This should be ignored"
      } as any)
      .exec();

    expect(extraFieldsUser).not.toBe(null);
    expect(extraFieldsUser).not.toHaveProperty("extraField");
  })

  it("inserts many documents", async () => {
    const newUsers = await collections.users
      .insertMany()
      .values(mockUsers)
      .exec();

    expect(newUsers.length).toBe(mockUsers.length);
  });

  it("finds documents", async () => {
    await collections.users
      .insertMany()
      .values(mockUsers)
      .exec();

    const users = await collections.users.find().exec();
    expect(users.length).toBeGreaterThanOrEqual(3);
  });

  it("finds one document", async () => {
    await collections.users
      .insert()
      .values(mockUsers[0])
      .exec();

    const user = await collections.users.findOne().exec();
    expect(user).toStrictEqual(
      expect.objectContaining(mockUsers[0])
    );
  });



  describe("Base Query methods", () => {

    it("query where with single condition", async () => {
      await collections.users
        .insertMany()
        .values(mockUsers)
        .exec();
      const users = await collections.users.find({}).exec();
      expect(users.length).toBeGreaterThanOrEqual(mockUsers.length);

      const firstUser = await collections.users.findOne({ name: "anon" }).exec();
      expect(firstUser?.name).toBe("anon");
    });

    it("query where with multiple conditions", async () => {
      await collections.users
        .insertMany()
        .values(mockUsers)
        .exec();

      const users = await collections.users.find({ name: "anon", age: 17 }).exec();
      expect(users.length).toBe(1);
    })

    it("query select/omit", async () => {
      await collections.users
        .insertMany()
        .values(mockUsers)
        .exec();

      const users1 = await collections.users.find().select("name", "email").exec();
      expect(users1[0].name).toBe("anon");
      expect(users1[0].email).toBe("anon@gmail.com");
      expect(users1[0].age).toBeUndefined();
      expect(users1[0].isVerified).toBeUndefined();

      const users2 = await collections.users.find().omit("name", "email").exec();
      expect(users2[0].name).toBeUndefined();
      expect(users2[0].email).toBeUndefined();
      expect(users2[0].age).toBe(17);
      expect(users2[0].isVerified).toBe(true);
    })

    it("query limit", async () => {
      await collections.users
        .insertMany()
        .values(mockUsers)
        .exec();
      const limit = 2
      const users = await collections.users.find().limit(limit).exec();
      expect(users.length).toBe(limit);
    })

    it("query skip", async () => {
      await collections.users
        .insertMany()
        .values(mockUsers)
        .exec();
      const skip = 2
      const users = await collections.users.find().skip(skip).exec();
      expect(users.length).toBe(mockUsers.length - skip);
    })
  })


  it("finds one and updates", async () => {
    await collections.users
      .insert()
      .values(mockUsers[0])
      .exec();

    const updatedUser = await collections.users
      .findOneAndUpdate()
      .where({ email: "anon@gmail.com" })
      .values({
        $set: {
          age: 30
        }
      }).options({
        returnDocument: "after"
      })
      .exec();



    expect(updatedUser).not.toBe(null);
    expect(updatedUser?.age).toBe(30);
  });

  it("finds one and deletes", async () => {
    await collections.users
      .insert()
      .values(mockUsers[0])
      .exec();

    const deletedUser = await collections.users
      .findOneAndDelete()
      .where({ email: "anon@gmail.com" })
      .exec();

    expect(deletedUser).not.toBe(null);
    expect(deletedUser?.email).toBe("anon@gmail.com");
  });

  it("counts documents", async () => {
    await collections.users
      .insertMany()
      .values(mockUsers)
      .exec();
    const count = await collections.users.count().exec();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("updates one document", async () => {
    await collections.users
      .insert()
      .values(mockUsers[1])
      .exec();
    const updated = await collections.users
      .updateOne()
      .where({ email: "anon1@gmail.com" })
      .set({ age: 35 })
      .exec();

    expect(updated).toBe(true);
  });

  it("updates many documents", async () => {
    await collections.users
      .insertMany()
      .values(mockUsers)
      .exec();
    const updated = await collections.users
      .updateMany()
      .where({ isVerified: false })
      .set({ age: 40 })
      .exec();

    expect(updated).toBe(true);
  });

  it("replaces one document", async () => {
    const firstUser = await collections.users
      .insert()
      .values(mockUsers[0])
      .exec();
    const replaced = await collections.users
      .replaceOne()
      .where({ email: "anon@gmail.com" })
      .values({ name: "New Name" })
      .exec();

    expect(replaced).toBe(true);
  });

  it("distinct method", async () => {
    await collections.users
      .insertMany()
      .values([{ name: "John", email: "john@example.com" }, { name: "Jane", email: "jane@example.com" }, { name: "John", email: "john@example.com" }])
      .exec();
    const distinctEmails = await collections.users
      .distinct("email")
      .exec();

    expect(distinctEmails).toEqual(["jane@example.com", "john@example.com"]);
  });

  it("estimatedDocumentCount", async () => {
    await collections.users
      .insertMany()
      .values(mockUsers)
      .exec();
    const estimatedCount = await collections.users.estimatedDocumentCount();

    expect(estimatedCount).toBe(3);
  });

  it("deletes one document", async () => {
    await collections.users
      .insert()
      .values(mockUsers[2])
      .exec();
    const deleted = await collections.users
      .deleteOne()
      .where({ email: "anon2@gmail.com" })
      .exec();

    expect(deleted.deletedCount).toBe(1);
  });

  it("bulk writes", async () => {
    const bulkWriteResult = await collections.users.bulkWrite([
      { insertOne: { document: { name: "bulk1", email: "bulk1@gmail.com", age: 22, isVerified: false } } },
      { insertOne: { document: { name: "bulk2", email: "bulk2@gmail.com", age: 23, isVerified: true } } },
    ]).exec();

    expect(bulkWriteResult.insertedCount).toBe(2);
  });

  it("creates index", async () => {
    const indexName = await collections.users.createIndex({ email: 1 });
    expect(indexName).toBeDefined();
  });

  it("creates multiple indexes", async () => {
    const indexNames = await collections.users.createIndexes([
      { name: 1 },
      { age: -1 },

    ]);
    expect(indexNames).toBeDefined();
  });

  it("drops an index", async () => {
    await collections.users.createIndex({ email: 1 });
    const indexes = await collections.users.listIndexes().toArray()
    // console.log({ indexes })

    const dropIndexResult = await collections.users.dropIndex("email_1");
    expect(dropIndexResult).toBeTruthy();
  });

  it("drops all indexes", async () => {
    const dropIndexesResult = await collections.users.dropIndexes();
    expect(dropIndexesResult).toBeTruthy();
  });

  it("lists indexes", async () => {
    await collections.users.createIndex({ email: 1 }, { unique: true });
    const indexes = await collections.users.listIndexes().toArray();
    expect(indexes.length).toBeGreaterThanOrEqual(1);
  });

  it("checks if an index exists", async () => {
    await collections.users.createIndex({ email: 1 }, { unique: true });
    const indexExists = await collections.users.indexExists("email_1");
    expect(indexExists).toBeTruthy();
  });

  it("gets index information", async () => {
    await collections.users.createIndex({ email: 1 }, { unique: true });
    const indexInformation = await collections.users.indexInformation({

    });
    console.log({ indexInformation })
    expect(indexInformation).toHaveProperty("email_1");
  });

  // it("creates a search index", async () => {
  //   const searchIndexName = await collections.users.createSearchIndex({});
  //   expect(searchIndexName).toBeDefined();
  // });

  // it("creates multiple search indexes", async () => {
  //   const searchIndexNames = await collections.users.createSearchIndexes([
  //     { name: 1 },
  //     { age: -1 },
  //   ]);
  //   expect(searchIndexNames).toBeDefined();
  // });

  // it("drops a search index", async () => {
  //   await collections.users.createSearchIndex({ email: 1 });
  //   const dropSearchIndexResult = await collections.users.dropSearchIndex("email_1");
  //   expect(dropSearchIndexResult).toBeTruthy();
  // });

  // it("lists search indexes", async () => {
  //   await collections.users.createSearchIndex({ email: 1 });
  //   const searchIndexes = await collections.users.listSearchIndexes();
  //   expect(searchIndexes).toHaveProperty("email_1");
  // });

  // it("updates a search index", async () => {
  //   await collections.users.createSearchIndex({ email: 1 });
  //   const updateSearchIndexResult = await collections.users.updateSearchIndex("email_1", { email: 1, name: 1 });
  //   expect(updateSearchIndexResult).toBeTruthy();
  // });


  it("aggregates data", async () => {

    await collections.users.insertMany().values(mockUsers).exec();

    const pipeline = [
      { $match: { isVerified: true } },
      { $group: { _id: "$isVerified", count: { $sum: 1 } } },
    ];
    const result = await collections.users.aggregate().addStage(pipeline[0]).addStage(pipeline[1]).exec();

    console.log({ aggregatedData: result })
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("watches for changes", async () => {
    const pipeline = [
      { $match: { operationType: "insert" } },
    ];
    const watchStream = collections.users.watch(pipeline).addStage({
      $match: { operationType: "insert" }

    }).exec().on("change", (change) => {
      expect(change.operationType).toBe("insert");
    });
    await collections.users.insertOne().values({ name: "Test User" }).exec();
    watchStream.close();
  });
});
