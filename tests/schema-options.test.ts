import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { describe, expect, it } from "vitest";
import { boolean, createDatabase, number, string } from "../src";
import { createSchema, parseSchema } from "../src/schema";

describe("Schema options", () => {
  it("omits fields", () => {
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

    const output = parseSchema(schema, {
      name: "tom",
      age: 0,
      isAdmin: true,
    });

    expect(output).toStrictEqual({ name: "tom", age: 0 });
  });

  it("adds extra fields", () => {
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

    const output = parseSchema(schema, {
      name: "tom cruise",
      age: 0,
      isAdmin: true,
    });

    expect(output).toStrictEqual({
      name: "tom cruise",
      age: 0,
      isAdmin: true,
      role: "admin",
    });
  });

  it("does not omit extra fields", () => {
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

    const output = parseSchema(schema, {
      name: "tom",
      age: 0,
      isAdmin: true,
    });

    expect(output).toStrictEqual({
      name: "tom",
      age: 0,
      isAdmin: true,
      role: "admin",
    });
  });

  it("replaces fields with extras", () => {
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

    const output = parseSchema(schema, {
      name: "tom",
      age: 0,
      isAdmin: true,
      role: 1,
    });

    expect(output).toStrictEqual({
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
        name: string(),
        age: number(),
      },
      {
        indexes() {
          return {
            name: [{ name: 1 }, { unique: true }],
          };
        },
      }
    );

    const server = await MongoMemoryServer.create();
    const client = new MongoClient(server.getUri());
    const db = createDatabase(client, { users: schema });

    // wait for indexes
    await new Promise((res) => setTimeout(res, 100));

    await db.collections.users.insert().values({ name: "bob", age: 0 }).exec();
    await expect(async () => {
      await db.collections.users
        .insert()
        .values({ name: "bob", age: 1 })
        .exec();
    }).rejects.toThrow("E11000 duplicate key error");
  });
});
