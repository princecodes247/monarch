import { MongoClient } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { boolean, createDatabase, createSchema, number, string } from "../src";

import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();
const client = new MongoClient(uri);

describe("test for boolean, number and string", () => {
  beforeAll(async () => {
    await client.connect();
  });

  it("inserts and finds", async () => {
    const UserSchema = createSchema("users", {
      name: string().nullable(),
      email: string().optional().lowercase(),
      age: number().optional().default(10),
      isVerified: boolean(),
    });

    const { db } = createDatabase(client, {
      users: UserSchema,
    });

    const newUser = await db.users
      .insert({
        email: "anon@gmail.com",
        name: "anon",
        age: 0,
        isVerified: true,
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        email: "anon@gmail.com",
        name: "anon",
        age: 0,
        isVerified: true,
      })
    );

    const users = await db.users.find().where({}).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        email: "anon@gmail.com",
        name: "anon",
        age: 0,
        isVerified: true,
      })
    );
  });
});
