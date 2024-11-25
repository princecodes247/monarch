import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  boolean,
  createDatabase,
  createSchema,
  number,
  objectId,
  pipe,
  string,
  type,
} from "../src";
import { mockUsers } from "./mock";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
const client = new MongoClient(uri);

const UserSchema = createSchema("users", {
  name: string().optional(),
  email: string().lowercase().optional(),
  age: number().optional().default(10),
  isVerified: boolean().default(false),
});
const TodoSchema = createSchema("todos", {
  _id: number(),
  title: string(),
  userId: objectId(),
});

const { collections } = createDatabase(client.db(), {
  users: UserSchema,
  todos: TodoSchema,
});

describe("Query methods Tests", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterEach(async () => {
    await collections.users.dropIndexes();
    await collections.users.deleteMany({}).exec();
    await collections.todos.dropIndexes();
    await collections.todos.deleteMany({}).exec();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it("inserts one document", async () => {
    const newUser1 = await collections.users.insertOne(mockUsers[0]).exec();

    expect(newUser1).not.toBe(null);

    const newUser2 = await collections.users.insertOne(mockUsers[0]).exec();

    expect(newUser2).not.toBe(null);

    // insert with existing id
    const id3 = new ObjectId();
    const newUser3 = await collections.users
      .insertOne({ _id: id3, ...mockUsers[0] })
      .exec();
    expect(newUser3).not.toBe(null);
    expect(newUser3._id).toStrictEqual(id3);

    // insert with existing string id
    const id4 = new ObjectId();
    const newUser4 = await collections.users
      .insertOne({ _id: id4.toString(), ...mockUsers[0] })
      .exec();
    expect(newUser4).not.toBe(null);
    expect(newUser4._id).toStrictEqual(id4);

    // insert with invalid string id
    await expect(async () => {
      await collections.users
        .insertOne({ _id: "not_an_object_id", ...mockUsers[0] })
        .exec();
    }).rejects.toThrow("expected valid ObjectId received");

    // Test edge case: Insert empty document
    const emptyUser = await collections.users.insertOne({}).exec();

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
      .insertOne({
        name: "Test",
        email: "TEST@EXAMPLE.COM",
        age: 30,
        isVerified: true,
      })
      .exec();

    expect(invalidEmailUser).not.toBe(null);
    expect(invalidEmailUser.email).toBe("test@example.com");

    // Test edge case: Insert document with extra fields
    const extraFieldsUser = await collections.users
      .insertOne({
        name: "Extra",
        email: "extra@example.com",
        age: 40,
        isVerified: true,
        extraField: "This should be ignored",
      } as any)
      .exec();

    expect(extraFieldsUser).not.toBe(null);
    expect(extraFieldsUser).not.toHaveProperty("extraField");
  });

  it("inserts many documents", async () => {
    const newUsers = await collections.users.insertMany(mockUsers).exec();

    expect(newUsers.insertedCount).toBe(mockUsers.length);
  });

  it("finds documents", async () => {
    await collections.users.insertMany(mockUsers).exec();

    const users = await collections.users.find().exec();
    expect(users.length).toBeGreaterThanOrEqual(3);
  });

  it("finds documents with cursor", async () => {
    await collections.users.insertMany(mockUsers).exec();

    const users1 = await collections.users.find().cursor();
    expect(await users1.next()).toMatchObject(mockUsers[0]);
    expect(await users1.next()).toMatchObject(mockUsers[1]);
    expect(await users1.next()).toMatchObject(mockUsers[2]);
    expect(await users1.next()).toBe(null);

    const users2 = await collections.users.find().cursor();
    let i = 0;
    for await (const user of users2) {
      expect(user).toMatchObject(mockUsers[i++]);
    }
  });

  it("finds one document", async () => {
    await collections.users.insertOne(mockUsers[0]).exec();

    const user = await collections.users.findOne({}).exec();
    expect(user).toStrictEqual(expect.objectContaining(mockUsers[0]));

    const userId = new ObjectId();
    const todoId = 1;
    await collections.users.insertOne({ _id: userId, ...mockUsers[0] }).exec();
    await collections.todos
      .insertOne({ _id: todoId, title: "todo 1", userId })
      .exec();

    // find with object id
    const user1 = await collections.users.findOne({ _id: userId }).exec();
    expect(user1).toStrictEqual({ _id: userId, ...mockUsers[0] });

    // find with string id
    const user2 = await collections.users
      //@ts-expect-error
      .findOne({ _id: userId.toString() })
      .exec();
    expect(user2).toBe(null);

    // find with non object id
    const todo = await collections.todos.findOne({ _id: todoId }).exec();
    expect(todo).toStrictEqual({ _id: todoId, title: "todo 1", userId });
  });

  it("finds one document by id", async () => {
    const userId = new ObjectId();
    const todoId = 1;
    await collections.users.insertOne({ _id: userId, ...mockUsers[0] }).exec();
    await collections.todos
      .insertOne({ _id: todoId, title: "todo 1", userId })
      .exec();

    // find with object id
    const user1 = await collections.users.findById(userId).exec();
    expect(user1).toStrictEqual({ _id: userId, ...mockUsers[0] });

    // find with string id
    const user2 = await collections.users.findById(userId.toString()).exec();
    expect(user2).toStrictEqual({ _id: userId, ...mockUsers[0] });

    // find with invalid object id
    await expect(async () => {
      await collections.users.findById("not_an_object_id").exec();
    }).rejects.toThrow();

    // find with non object id
    const todo1 = await collections.todos.findById(todoId).exec();
    expect(todo1).toStrictEqual({ _id: todoId, title: "todo 1", userId });

    const todo2 = await collections.todos.findById(todoId + 1).exec();
    expect(todo2).toBe(null);
  });

  describe("Base Query methods", () => {
    it("query where with single condition", async () => {
      await collections.users.insertMany(mockUsers).exec();
      const users = await collections.users.find().exec();
      expect(users.length).toBeGreaterThanOrEqual(mockUsers.length);

      const firstUser = await collections.users
        .findOne({ name: "anon" })
        .exec();
      expect(firstUser?.name).toBe("anon");
    });

    it("query where with multiple conditions", async () => {
      await collections.users.insertMany(mockUsers).exec();

      const users = await collections.users
        .find({ name: "anon", age: 17 })
        .exec();
      expect(users.length).toBe(1);
    });

    it("query select/omit", async () => {
      await collections.users.insertMany(mockUsers).exec();

      const users1 = await collections.users
        .find()
        .select({ name: true, email: true })
        .exec();
      expect(users1[0].name).toBe("anon");
      expect(users1[0].email).toBe("anon@gmail.com");
      // @ts-expect-error
      expect(users1[0].age).toBeUndefined();
      // @ts-expect-error
      expect(users1[0].isVerified).toBeUndefined();

      const users2 = await collections.users
        .find()
        .omit({ name: true, email: true })
        .exec();
      // @ts-expect-error
      expect(users2[0].name).toBeUndefined();
      // @ts-expect-error
      expect(users2[0].email).toBeUndefined();
      expect(users2[0].age).toBe(17);
      expect(users2[0].isVerified).toBe(true);
    });

    it("query limit", async () => {
      await collections.users.insertMany(mockUsers).exec();
      const limit = 2;
      const users = await collections.users.find().limit(limit).exec();
      expect(users.length).toBe(limit);
    });

    it("query skip", async () => {
      await collections.users.insertMany(mockUsers).exec();
      const skip = 2;
      const users = await collections.users.find().skip(skip).exec();
      expect(users.length).toBe(mockUsers.length - skip);
    });

    it("query sort", async () => {
      await collections.users.insertMany(mockUsers).exec();
      const users = await collections.users
        .find()
        .sort({
          age: -1,
        })
        .exec();
      expect(users[0].age).toBe(25);
      expect(users[1].age).toBe(20);
      expect(users[2].age).toBe(17);

      const users2 = await collections.users
        .find()
        .sort({
          email: "asc",
        })
        .exec();
      expect(users2[0].email).toBe("anon1@gmail.com");
      expect(users2[1].email).toBe("anon2@gmail.com");
      expect(users2[2].email).toBe("anon@gmail.com");
    });
  });

  it("finds one and updates", async () => {
    await collections.users.insertOne(mockUsers[0]).exec();

    const updatedUser = await collections.users
      .findOneAndUpdate(
        { email: "anon@gmail.com" },
        {
          $set: {
            age: 30,
          },
        },
      )
      .options({
        returnDocument: "after",
      })
      .exec();

    expect(updatedUser).not.toBe(null);
    expect(updatedUser?.age).toBe(30);
  });

  it("finds one and deletes", async () => {
    await collections.users.insertOne(mockUsers[0]).exec();

    const deletedUser = await collections.users
      .findOneAndDelete({ email: "anon@gmail.com" })
      .exec();

    expect(deletedUser).not.toBe(null);
    expect(deletedUser?.email).toBe("anon@gmail.com");
  });

  it("counts documents", async () => {
    await collections.users.insertMany(mockUsers).exec();
    const count = await collections.users.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("updates one document", async () => {
    await collections.users.insertOne(mockUsers[1]).exec();
    const updated = await collections.users
      .updateOne({ email: "anon1@gmail.com" }, { $set: { age: 35 } })
      .exec();

    expect(updated.acknowledged).toBe(true);
  });

  it("updates many documents", async () => {
    await collections.users.insertMany(mockUsers).exec();
    const updated = await collections.users
      .updateMany({ isVerified: false }, { $set: { age: 40 } })
      .exec();

    expect(updated.acknowledged).toBe(true);
  });

  it("replaces one document", async () => {
    const original = await collections.users.insertOne(mockUsers[0]).exec();
    const replaced = await collections.users
      .replaceOne(
        { email: "anon@gmail.com" },
        {
          ...original,
          name: "New Name",
        },
      )
      .exec();

    expect(replaced.modifiedCount).toBe(1);
  });

  it("distinct method", async () => {
    await collections.users
      .insertMany([
        { name: "John", email: "john@example.com" },
        { name: "Jane", email: "jane@example.com" },
        { name: "John", email: "john@example.com" },
      ])
      .exec();
    const distinctEmails = await collections.users.distinct("email");

    expect(distinctEmails).toEqual(["jane@example.com", "john@example.com"]);
  });

  it("estimatedDocumentCount", async () => {
    await collections.users.insertMany(mockUsers).exec();
    const estimatedCount = await collections.users.estimatedDocumentCount();

    expect(estimatedCount).toBe(3);
  });

  it("deletes one document", async () => {
    await collections.users.insertOne(mockUsers[2]).exec();
    const deleted = await collections.users
      .deleteOne({ email: "anon2@gmail.com" })
      .exec();

    expect(deleted.deletedCount).toBe(1);
  });

  it("bulk writes", async () => {
    const bulkWriteResult = await collections.users
      .bulkWrite([
        {
          insertOne: {
            document: {
              name: "bulk1",
              email: "bulk1@gmail.com",
              age: 22,
              isVerified: false,
            },
          },
        },
        {
          insertOne: {
            document: {
              name: "bulk2",
              email: "bulk2@gmail.com",
              age: 23,
              isVerified: true,
            },
          },
        },
      ])
      .exec();

    expect(bulkWriteResult.insertedCount).toBe(2);
  });

  it("creates index", async () => {
    const indexName = await collections.users.createIndex({ email: 1 });
    expect(indexName).toBeDefined();
  });

  it("creates multiple indexes", async () => {
    const indexNames = await collections.users.createIndexes([
      { key: { name: 1 } },
      { key: { age: -1 } },
    ]);
    expect(indexNames).toBeDefined();
  });

  it("drops an index", async () => {
    await collections.users.createIndex({ email: 1 });
    const indexes = await collections.users.listIndexes().toArray();

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
    const indexInformation = await collections.users.indexInformation({});
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
    await collections.users.insertMany(mockUsers).exec();
    const result = await collections.users
      .aggregate()
      .addStage({ $match: { isVerified: true } })
      .addStage({ $group: { _id: "$isVerified", count: { $sum: 1 } } })
      .exec();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("watches for changes", async () => {
    const pipeline = [{ $match: { operationType: "insert" } }];
    const watchStream = collections.users
      .watch(pipeline)
      .on("change", (change) => {
        expect(change.operationType).toBe("insert");
      });
    await collections.users.insertOne({ name: "Test User" }).exec();
    watchStream.close();
  });

  it("executes raw MongoDB operations", async () => {
    const result = await collections.users.raw().find().toArray();
    expect(result).toBeInstanceOf(Array);
  });

  it("updates after initial save", async () => {
    const schema = createSchema("users", {
      name: string(),
      age: number().onUpdate(() => 100),
      isAdmin: boolean(),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
        age: 0,
        isAdmin: true,
      })
      .exec();
    const doc = await db.collections.users.findOne({ _id: res._id }).exec();
    expect(doc).toStrictEqual({
      _id: res._id,
      name: "tom",
      age: 0,
      isAdmin: true,
    });
    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      age: 100,
      isAdmin: true,
    });
  });

  it("updates with transform", async () => {
    let nonce = 1;
    const onUpdateTrap = vi.fn(() => nonce++);
    const transformTrap = vi.fn((val: number) => String(val));
    const schema = createSchema("users", {
      name: string(),
      nonce: number().onUpdate(onUpdateTrap).transform(transformTrap),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
        nonce: 0,
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(0);
    expect(transformTrap).toBeCalledTimes(1);
    expect(res).toStrictEqual({ _id: res._id, name: "tom", nonce: "0" });

    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(1);
    expect(transformTrap).toBeCalledTimes(2);
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      nonce: "1",
    });
  });

  it("updates with validate", async () => {
    let nonce = 1;
    const onUpdateTrap = vi.fn(() => nonce++);
    const schema = createSchema("users", {
      name: string(),
      nonce: number()
        .onUpdate(onUpdateTrap)
        .validate(() => true, ""),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
        nonce: 0,
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(0);
    expect(res).toStrictEqual({ _id: res._id, name: "tom", nonce: 0 });

    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(1);
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      nonce: 1,
    });
  });

  it("updates with optional", async () => {
    let nonce = 1;
    const onUpdateTrap = vi.fn(() => nonce++);
    const schema = createSchema("users", {
      name: string(),
      nonce: number().onUpdate(onUpdateTrap).optional(),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(0);
    expect(res).toStrictEqual({ _id: res._id, name: "tom" });

    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(1);
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      nonce: 1,
    });
  });

  it("updates with nullable", async () => {
    let nonce = 1;
    const onUpdateTrap = vi.fn(() => nonce++);
    const schema = createSchema("users", {
      name: string(),
      nonce: number().onUpdate(onUpdateTrap).nullable(),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
        nonce: null,
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(0);
    expect(res).toStrictEqual({ _id: res._id, name: "tom", nonce: null });

    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(1);
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      nonce: 1,
    });
  });

  it("updates with defaulted", async () => {
    let nonce = 1;
    const onUpdateTrap = vi.fn(() => nonce++);
    const schema = createSchema("users", {
      name: string(),
      nonce: number().onUpdate(onUpdateTrap).default(0),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(0);
    expect(res).toStrictEqual({ _id: res._id, name: "tom", nonce: 0 });

    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(1);
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      nonce: 1,
    });
  });

  it("updates with pipe", async () => {
    let nonce = 1;
    const onUpdateTrap = vi.fn(() => nonce++);
    const schema = createSchema("users", {
      name: string(),
      nonce: pipe(
        type((input: number) => String(input)),
        string(),
      ).onUpdate(onUpdateTrap),
    });
    const db = createDatabase(client.db(), { users: schema });
    const res = await db.collections.users
      .insertOne({
        name: "tom",
        nonce: 0,
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(0);
    expect(res).toStrictEqual({ _id: res._id, name: "tom", nonce: "0" });

    const updatedDoc = await db.collections.users
      .findOneAndUpdate({ _id: res._id }, { $set: { name: "jerry" } })
      .options({
        returnDocument: "after",
      })
      .exec();
    expect(onUpdateTrap).toBeCalledTimes(1);
    expect(updatedDoc).toStrictEqual({
      _id: res._id,
      name: "jerry",
      nonce: "1",
    });
  });
});
