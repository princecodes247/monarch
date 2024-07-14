import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase, createSchema, date, dateString } from "../src";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();
const client = new MongoClient(uri);

describe("test for date", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it("insert's date object and find's it", async () => {
    const UserSchema = createSchema("users", {
      currentDate: date(),
    });
    const markedDate = new Date();
    const { db, collections } = createDatabase(client, {
      users: UserSchema,
    });

    // collections query builder
    const newUser = await collections.users
      .insert().values({
        currentDate: markedDate,
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate,
      })
    );

    // db query builder
    const users = await db(UserSchema)
      .find()
      .where({ currentDate: markedDate })
      .exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate,
      })
    );
  });

  it("insert's date string and find's it", async () => {
    const UserSchema = createSchema("users", {
      currentDate: dateString(),
    });
    const markedDate = new Date();
    const { db, collections } = createDatabase(client, {
      users: UserSchema,
    });

    // collections query builder
    const newUser = await collections.users
      .insert()
      .values({
        currentDate: markedDate,
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate.toISOString(),
      })
    );

    // db query builder
    const users = await db(UserSchema)
      .find()
      .where({ currentDate: markedDate.toISOString() })
      .exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate.toISOString(),
      })
    );
  });
});
