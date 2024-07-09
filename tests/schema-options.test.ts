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

  it("transforms fields", () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
      },
      {
        transform: {
          age: (value) => value.toString(),
        },
      }
    );

    const output = parseSchema(schema, {
      name: "tom",
      age: 0,
      isAdmin: true,
    });

    expect(output).toStrictEqual({ name: "tom", age: "0", isAdmin: true });
  });

  it("omits transformed fields", () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
      },
      {
        omit: {
          age: true,
        },
        transform: {
          age: (value) => value.toString(),
        },
      }
    );

    const output = parseSchema(schema, {
      name: "tom",
      age: 0,
      isAdmin: true,
    });

    expect(output).toStrictEqual({ name: "tom", isAdmin: true });
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
        extras(values) {
          return {
            initials: values.name
              .split(" ")
              .map((w) => w[0])
              .join(""),
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
      initials: "tc",
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
        extras(values) {
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
        role: string(), // manually added field to replace
      },
      {
        extras(values) {
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
      role: "user",
    });

    expect(output).toStrictEqual({
      name: "tom",
      age: 0,
      isAdmin: true,
      role: "admin",
    });
  });

  it("calls extras with pre transformed output", () => {
    const schema = createSchema(
      "users",
      {
        name: string(),
        age: number(),
        isAdmin: boolean(),
      },
      {
        transform: {
          isAdmin: (value) => (value ? "yes" : "no"), // negate admin flag
        },
        extras(values) {
          return {
            extraIsAdmin: values.isAdmin,
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
      isAdmin: "yes",
      extraIsAdmin: true,
    });
  });
});
