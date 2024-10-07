import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabase,
  createdAtDate,
  createSchema,
  date,
  dateString,
  updatedAtDate,
} from "../src";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();
const client = new MongoClient(uri);

const delay = (duration: number) =>
  new Promise((res) => setTimeout(res, duration));

describe("test for date", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterEach(async () => {
    await client.db().dropDatabase();
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
      .insert()
      .values({
        currentDate: markedDate,
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate.toISOString(),
      }),
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
      }),
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
      }),
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
      }),
    );
  });

  it("createdAtDate", async () => {
    const UserSchema = createSchema("users", {
      createdAt: createdAtDate(),
    });
    const beforeInsert = new Date();
    const { db, collections } = createDatabase(client, {
      users: UserSchema,
    });

    // check inserted document date is in between beforeInsert and afterInsert
    await delay(10);
    const newUser = await collections.users.insert().values({}).exec();
    await delay(10);
    const afterInsert = new Date();
    expect(newUser).not.toBe(null);
    expect(new Date(newUser.createdAt).getTime()).toBeGreaterThan(
      beforeInsert.getTime(),
    );
    expect(new Date(newUser.createdAt).getTime()).toBeLessThan(
      afterInsert.getTime(),
    );

    // check existing document date is in between beforeInsert and afterInsert
    const users = await db(UserSchema).find().exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).not.toBe(null);
    expect(new Date(existingUser.createdAt).getTime()).toBeGreaterThan(
      beforeInsert.getTime(),
    );
    expect(new Date(existingUser.createdAt).getTime()).toBeLessThan(
      afterInsert.getTime(),
    );
  });

  it("updatedAtDate", async () => {
    const UserSchema = createSchema("users", {
      updatedAt: updatedAtDate(),
    });
    const beforeInsert = new Date();
    const { db, collections } = createDatabase(client, {
      users: UserSchema,
    });

    // check inserted document date is in between beforeInsert and afterInsert
    await delay(10);
    const newUser = await collections.users.insert().values({}).exec();
    await delay(10);
    const afterInsert = new Date();
    expect(newUser).not.toBe(null);
    expect(new Date(newUser.updatedAt).getTime()).toBeGreaterThan(
      beforeInsert.getTime(),
    );
    expect(new Date(newUser.updatedAt).getTime()).toBeLessThan(
      afterInsert.getTime(),
    );

    // check existing document date is in between beforeInsert and afterInsert
    const users = await db(UserSchema).find().exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).not.toBe(null);
    expect(new Date(existingUser.updatedAt).getTime()).toBeGreaterThan(
      beforeInsert.getTime(),
    );
    expect(new Date(existingUser.updatedAt).getTime()).toBeLessThan(
      afterInsert.getTime(),
    );

    // update user
    const beforeUpdate = new Date();
    await delay(10);
    await db(UserSchema).updateOne().where({}).values({ $set: {} }).exec();
    await delay(10);
    const afterUpdate = new Date();

    // check updated document date is in between beforeInsert and afterInsert
    const updatedUsers = await db(UserSchema).find().exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const updatedUser = updatedUsers[0];
    expect(updatedUser).not.toBe(null);
    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(
      beforeInsert.getTime(),
    );
    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(
      afterInsert.getTime(),
    );
    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(
      beforeUpdate.getTime(),
    );
    expect(new Date(updatedUser.updatedAt).getTime()).toBeLessThan(
      afterUpdate.getTime(),
    );
  });
});
