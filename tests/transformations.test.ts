import { MongoClient } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { createDatabase, createSchema, string } from "../src";

const client = new MongoClient("mongodb://localhost:27017/monarch-test");
describe("test for transformations", () => {
  beforeAll(async () => {
    await client.connect();
  });

  it("returns value in lowercase", async () => {
    const UserSchema = createSchema("users", {
      name: string().lowercase(),
    });

    const { db } = createDatabase(client, {
      users: UserSchema,
    });

    const newUser = await db.users
      .insert({
        name: "so",
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        name: "prince",
      })
    );

    const users = await db.users.find().where({ _id: newUser?._id }).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "prince",
      })
    );
  });

  it("returns value in uppercase", async () => {
    const UserSchema = createSchema("userUpper", {
      name: string().uppercase(),
    });

    const { db } = createDatabase(client, {
      users: UserSchema,
    });

    const newUser = await db.users
      .insert({
        name: "EriiC",
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        name: "ERIIC",
      })
    );

    const users = await db.users.find().where({ _id: newUser?._id }).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "ERIIC",
      })
    );
  });

  it("returns value with '-go' at the end", async () => {
    const UserSchema = createSchema("userWithGo", {
      name: string().addTransformation((value) => `${value}-go`),
    });
    const { db } = createDatabase(client, {
      users: UserSchema,
    });
    const newUser = await db.users
      .insert({
        name: "mon",
      })
      .exec();
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        name: "mon-go",
      })
    );

    const users = await db.users.find().where({}).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "mon-go",
      })
    );
  });
});
