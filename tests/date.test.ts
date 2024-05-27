import { MongoClient } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { createDatabase, createSchema, date } from "../src";

const client = new MongoClient("mongodb://localhost:27017/monarch-test");

describe("test for date", () => {
  beforeAll(async () => {
    await client.connect();
  });

  it("inserts and finds", async () => {
    const UserSchema = createSchema("users", {
      currentDate: date(),
    });
    const markedDate = new Date();
    const { db } = createDatabase(client, {
      users: UserSchema,
    });

    const newUser = await db.users
      .insert({
        currentDate: markedDate,
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate,
      })
    );

    const users = await db.users
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
});
