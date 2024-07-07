import { MongoClient } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
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
  name: string().nullable(),
  email: string().lowercase().optional(),
  age: number().optional().default(10),
  isVerified: boolean(),
});

const { collections, db } = createDatabase(client, {
  users: UserSchema,
});

describe("Query Tests", () => {

  beforeAll(async () => {
    await client.connect();

  

  });

  it("inserts one document", async () => {
    const newUser = await collections.users
      .insertOne()
      .values(mockUsers[0])
      .exec();

    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining(mockUsers[0])
    );
  });

  it("inserts many documents", async () => {
    const newUsers = await collections.users
      .insertMany()
      .values(mockUsers.splice(1))
      .exec();

    expect(newUsers.insertedCount).toBe(2);
  });

  it("finds documents", async () => {
    const users = await collections.users.find().where({}).exec();
    expect(users.length).toBeGreaterThanOrEqual(3);
  });

  it("finds one document", async () => {
    
    const user = await collections.users.findOne().where({ email: "anon@gmail.com", }).exec();
    expect(user).toStrictEqual(
      expect.objectContaining(mockUsers[0])
    );
  });

  it("finds one and updates", async () => {
    const updatedUser = await collections.users
      .findOneAndUpdate()
      .where({ email: "anon@gmail.com" })
      .values({ $set: {
        age: 30
      } })
      .exec();

      

    expect(updatedUser).not.toBe(null);
    expect(updatedUser?.age).toBe(30);
  });

  it("finds one and deletes", async () => {
    const deletedUser = await collections.users
      .findOneAndDelete()
      .where({ email: "anon@gmail.com" })
      .exec();

    expect(deletedUser).not.toBe(null);
    expect(deletedUser?.email).toBe("anon@gmail.com");
  });

  it("counts documents", async () => {
    const count = await collections.users.count().exec();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("updates one document", async () => {
    const updated = await collections.users
      .updateOne()
      .where({ email: "anon1@gmail.com" })
      .set({ age: 35 })
      .exec();

    expect(updated).toBe(true);
  });

  it("updates many documents", async () => {
    const updated = await collections.users
      .updateMany()
      .where({ isVerified: false })
      .set({ age: 40 })
      .exec();

    expect(updated).toBe(true);
  });

  it("deletes one document", async () => {
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
    const indexName = await collections.users.createIndex({ email: 1 }, { unique: true });
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
    await collections.users.createIndex({ email: 1 }, { unique: true });
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

  it("aggregates data", async () => {
    const pipeline = [
      { $match: { isVerified: true } },
      { $group: { _id: "$isVerified", count: { $sum: 1 } } },
    ];
    const aggregatedData = await collections.users.aggregate().addStage(pipeline[0]).addStage(pipeline[1]).exec();
    expect(aggregatedData).toBeInstanceOf(Array);
    expect(aggregatedData.length).toBeGreaterThanOrEqual(1);
  });
});
