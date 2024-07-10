import { describe, expect, it } from "vitest";
import { boolean, number, string } from "../src";
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
});
