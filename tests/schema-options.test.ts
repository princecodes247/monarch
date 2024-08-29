import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { boolean, createDatabase, createSchema, number, string } from "../src";

const server = await MongoMemoryServer.create();
const client = new MongoClient(server.getUri());

describe("Schema options", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterEach(async () => {
    await client.db().dropDatabase();
  });

  afterAll(async () => {
    await client.close();
    await server.stop();
  });

  it("omits fields", async () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
      },
      {
        omit: {
          isAdmin: true,
        },
      }
    );
    const db = createDatabase(client, { users: schema });
    const res = await db.collections.users
      .insert()
      .values({
        name: "tom",
        age: 0,
        isAdmin: true,
      })
      .exec();
    const doc = await db.collections.users
      .findOne()
      .where({ _id: res._id })
      .exec();
    expect(doc).toStrictEqual({ _id: res._id, name: "tom", age: 0 });
  });

  it("adds virtuals fields", async () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
      },
      {
        virtuals(values) {
          return {
            role: values.isAdmin ? "admin" : "user",
          };
        },
      }
    );
    const db = createDatabase(client, { users: schema });
    const res = await db.collections.users
      .insert()
      .values({
        name: "tom cruise",
        age: 0,
        isAdmin: true,
      })
      .exec();
    const doc = await db.collections.users
      .findOne()
      .where({ _id: res._id })
      .exec();
    expect(doc).toStrictEqual({
      _id: res._id,
      name: "tom cruise",
      age: 0,
      isAdmin: true,
      role: "admin",
    });
  });

  it("does not omit virtual fields", async () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
      },
      {
        omit: {
          // @ts-expect-error
          role: true,
        },
        virtuals(values) {
          return {
            role: values.isAdmin ? "admin" : "user",
          };
        },
      }
    );
    const db = createDatabase(client, { users: schema });
    const res = await db.collections.users
      .insert()
      .values({
        name: "tom",
        age: 0,
        isAdmin: true,
      })
      .exec();
    const doc = await db.collections.users
      .findOne()
      .where({ _id: res._id })
      .exec();
    expect(doc).toStrictEqual({
      _id: res._id,
      name: "tom",
      age: 0,
      isAdmin: true,
      role: "admin",
    });
  });

  it("replaces fields with virtuals", async () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
        role: number(), // manually added field to replace
      },
      {
        virtuals(values) {
          return {
            role: values.isAdmin ? "admin" : "user",
          };
        },
      }
    );
    const db = createDatabase(client, { users: schema });
    const res = await db.collections.users
      .insert()
      .values({
        name: "tom",
        age: 0,
        isAdmin: true,
        role: 1,
      })
      .exec();
    const doc = await db.collections.users
      .findOne()
      .where({ _id: res._id })
      .exec();
    expect(doc).toStrictEqual({
      _id: res._id,
      name: "tom",
      age: 0,
      isAdmin: true,
      role: "admin",
    });
  });

  it("creates index", async () => {
    const schema = createSchema(
      "users",
      {
        firstname: string(),
        surname: string(),
        username: string(),
        age: number(),
      },
      {
        indexes({ createIndex, unique }) {
          return {
            username: unique("username"),
            fullname: createIndex(
              { firstname: 1, surname: 1 },
              { unique: true }
            ),
          };
        },
      }
    );
    const db = createDatabase(client, { users: schema });
    // TODO: wait for indexes
    await new Promise((res) => setTimeout(res, 100));

    // duplicate username
    await db.collections.users
      .insert()
      .values({
        firstname: "bob",
        surname: "paul",
        username: "bobpaul",
        age: 0,
      })
      .exec();
    await expect(async () => {
      await db.collections.users
        .insert()
        .values({
          firstname: "bobby",
          surname: "paul",
          username: "bobpaul",
          age: 0,
        })
        .exec();
    }).rejects.toThrow("E11000 duplicate key error");

    // duplicate firstname and lastname pair
    await db.collections.users
      .insert()
      .values({
        firstname: "alice",
        surname: "wonder",
        username: "alicewonder",
        age: 0,
      })
      .exec();
    await expect(async () => {
      await db.collections.users
        .insert()
        .values({
          firstname: "alice",
          surname: "wonder",
          username: "allywon",
          age: 0,
        })
        .exec();
    }).rejects.toThrow("E11000 duplicate key error");
  });

  it("updates after initial save", async () => {
    const schema = createSchema("users", {
      name: string(),
      age: number().onUpdate(() => 100),
      isAdmin: boolean(),
    });
    const db = createDatabase(client, { users: schema });
    const res = await db.collections.users
      .insert()
      .values({
        name: "tom",
        age: 0,
        isAdmin: true,
      })
      .exec();
    const doc = await db.collections.users
      .findOne()
      .where({ _id: res._id })
      .exec();
    expect(doc).toStrictEqual({
      _id: res._id,
      name: "tom",
      age: 0,
      isAdmin: true,
    });
    const updatedDoc = await db.collections.users
      .findOneAndUpdate()
      .where({ _id: res._id })
      .values({ $set: { name: "jerry" } })
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
});
