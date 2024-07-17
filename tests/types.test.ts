import { describe, expect, it, test, vi } from "vitest";
import {
  array,
  boolean,
  createSchema,
  literal,
  number,
  object,
  record,
  string,
  taggedUnion,
  tuple,
  type,
} from "../src";

const numberString = () => type<number, `${number}`>((input) => `${input}`);

describe("Types", () => {
  it("validates and transforms input", () => {
    const schema = createSchema("users", {
      name: string(),
      upperName: string().transform((input) => input.toUpperCase()),
      age: numberString(),
    });
    const data = schema.toData({
      name: "tom",
      upperName: "tom",
      age: 0,
    });
    expect(data).toStrictEqual({ name: "tom", upperName: "TOM", age: "0" });
  });

  it("validate and transform order", () => {
    const schema = createSchema("test", {
      name: string()
        .uppercase() // should have made everything uppercase
        .validate(
          (input) => input.toUpperCase() === input,
          "String is not in all caps"
        ),
    });
    expect(() => schema.toData({ name: "somename" })).not.toThrowError();
  });

  test("nullable", () => {
    // transform is skipped when value is null
    const schema1 = createSchema("users", {
      age: numberString().nullable(),
    });
    const data1 = schema1.toData({ age: null });
    expect(data1).toStrictEqual({ age: null });

    // transform is applied when value is not null
    const schema2 = createSchema("users", {
      age: numberString().nullable(),
    });
    const data2 = schema2.toData({ age: 0 });
    expect(data2).toStrictEqual({ age: "0" });
  });

  test("optional", () => {
    // transform is skipped when value is undefined
    const schema1 = createSchema("users", {
      age: numberString().optional(),
    });
    const data1 = schema1.toData({});
    expect(data1).toStrictEqual({ age: undefined });

    // transform is applied when value is not undefined
    const schema2 = createSchema("users", {
      age: numberString().optional(),
    });
    const data2 = schema2.toData({ age: 0 });
    expect(data2).toStrictEqual({ age: "0" });
  });

  test("default", () => {
    // default value is used when value is ommited
    const defaultFnTrap1 = vi.fn(() => 11);
    const schema1 = createSchema("users", {
      age: numberString().default(10),
      ageLazy: numberString().default(defaultFnTrap1),
    });
    const data1 = schema1.toData({});
    expect(data1).toStrictEqual({ age: "10", ageLazy: "11" });
    expect(defaultFnTrap1).toHaveBeenCalledTimes(1);

    // default value is ignored when value is not null or undefined
    const defaultFnTrap2 = vi.fn(() => 11);
    const schema2 = createSchema("users", {
      age: numberString().default(10),
      ageLazy: numberString().default(defaultFnTrap2),
    });
    const data2 = schema2.toData({ age: 1, ageLazy: 2 });
    expect(data2).toStrictEqual({ age: "1", ageLazy: "2" });
    expect(defaultFnTrap2).toHaveBeenCalledTimes(0);
  });

  test("pipe", () => {
    const outerValidateFnTrap = vi.fn(() => true);
    const innerValidateFnTrap = vi.fn(() => true);

    const schema1 = createSchema("test", {
      count: string()
        .validate(outerValidateFnTrap, "invalid count string")
        .transform(parseInt)
        .pipe(
          number()
            .validate(innerValidateFnTrap, "invalid count number")
            .transform((num) => num * 1000)
            .transform((str) => `count-${str}`)
        ),
    });
    const data1 = schema1.toData({ count: "1" });
    expect(data1).toStrictEqual({ count: "count-1000" });
    expect(outerValidateFnTrap).toHaveBeenCalledTimes(1);
    expect(innerValidateFnTrap).toHaveBeenCalledTimes(1);
    outerValidateFnTrap.mockClear();
    innerValidateFnTrap.mockClear();

    // outer default (before)
    const schema2 = createSchema("test", {
      count: string()
        .validate(outerValidateFnTrap, "invalid count string")
        .transform(parseInt)
        .default("2")
        .pipe(
          number()
            .validate(innerValidateFnTrap, "invalid count number")
            .transform((num) => num * 1000)
            .transform((str) => `count-${str}`)
        ),
    });
    const data2 = schema2.toData({});
    expect(data2).toStrictEqual({ count: "count-2000" });
    expect(outerValidateFnTrap).toHaveBeenCalledTimes(1);
    expect(innerValidateFnTrap).toHaveBeenCalledTimes(1);
    outerValidateFnTrap.mockClear();
    innerValidateFnTrap.mockClear();

    // outer default (after)
    const schema3 = createSchema("test", {
      count: string()
        .validate(outerValidateFnTrap, "invalid count string")
        .transform(parseInt)
        .pipe(
          number()
            .validate(innerValidateFnTrap, "invalid count number")
            .transform((num) => num * 1000)
            .transform((str) => `count-${str}`)
        )
        .default("3"),
    });
    const data3 = schema3.toData({});
    expect(data3).toStrictEqual({ count: "count-3000" });
    expect(outerValidateFnTrap).toHaveBeenCalledTimes(1);
    expect(innerValidateFnTrap).toHaveBeenCalledTimes(1);
    outerValidateFnTrap.mockClear();
    innerValidateFnTrap.mockClear();

    // inner default
    const schema4 = createSchema("test", {
      count: string()
        .validate(outerValidateFnTrap, "invalid count string")
        .transform(parseInt)
        .optional()
        .pipe(
          number()
            .validate(innerValidateFnTrap, "invalid count number")
            .transform((num) => num * 1000)
            .transform((str) => `count-${str}`)
            .default(4)
        ),
    });
    const data4 = schema4.toData({});
    expect(data4).toStrictEqual({ count: "count-4000" });
    expect(outerValidateFnTrap).toHaveBeenCalledTimes(0);
    expect(innerValidateFnTrap).toHaveBeenCalledTimes(1);
    outerValidateFnTrap.mockClear();
    innerValidateFnTrap.mockClear();
  });

  test("object", () => {
    const schema = createSchema("test", {
      permissions: object({
        canUpdate: boolean(),
        canDelete: boolean().default(false),
        role: literal("admin", "moderator", "customer"),
      }),
    });

    // @ts-expect-error
    expect(() => schema.toData({})).toThrowError(
      "expected 'object' received 'undefined'"
    );
    expect(() =>
      // @ts-expect-error
      schema.toData({ permissions: { canUpdate: "yes" } })
    ).toThrowError("field 'canUpdate' expected 'boolean' received 'string'");
    // fields are validates in the order they are registered in type
    expect(() =>
      // @ts-expect-error
      schema.toData({ permissions: { role: false } })
    ).toThrowError("field 'canUpdate' expected 'boolean' received 'undefined'");
    // unknwon fields are rejected
    expect(() =>
      schema.toData({
        // @ts-expect-error
        permissions: { canUpdate: true, role: "admin", canCreate: true },
      })
    ).toThrowError(
      "unknown field 'canCreate', object may only specify known fields"
    );
    const data = schema.toData({
      permissions: { canUpdate: true, role: "moderator" },
    });
    expect(data).toStrictEqual({
      permissions: { canUpdate: true, canDelete: false, role: "moderator" },
    });
  });

  test("record", () => {
    const schema = createSchema("test", {
      grades: record(number()),
    });

    // @ts-expect-error
    expect(() => schema.toData({})).toThrowError(
      "expected 'object' received 'undefined'"
    );
    // empty object is ok
    expect(() => schema.toData({ grades: {} })).not.toThrowError();
    expect(() =>
      // @ts-expect-error
      schema.toData({ grades: { math: "50" } })
    ).toThrowError("field 'math' expected 'number' received 'string'");
    const data = schema.toData({ grades: { math: 50 } });
    expect(data).toStrictEqual({ grades: { math: 50 } });
  });

  test("tuple", () => {
    const schema = createSchema("test", {
      items: tuple([number(), string()]),
    });

    // @ts-expect-error
    expect(() => schema.toData({})).toThrowError(
      "expected 'array' received 'undefined'"
    );
    // @ts-expect-error
    expect(() => schema.toData({ items: [] })).toThrowError(
      "element at index '0' expected 'number' received 'undefined'"
    );
    const data = schema.toData({ items: [0, "1"] });
    expect(data).toStrictEqual({ items: [0, "1"] });
    // @ts-expect-error
    expect(() => schema.toData({ items: [1, "1", 2] })).toThrowError(
      "expected array with 2 elements received 3 elements"
    );
  });

  test("array", () => {
    const schema = createSchema("test", {
      items: array(number()),
    });

    // @ts-expect-error
    expect(() => schema.toData({})).toThrowError(
      "expected 'array' received 'undefined'"
    );
    // empty array is ok
    expect(() => schema.toData({ items: [] })).not.toThrowError();
    // @ts-expect-error
    expect(() => schema.toData({ items: [0, "1"] })).toThrowError(
      "element at index '1' expected 'number' received 'string'"
    );
    const data = schema.toData({ items: [0, 1] });
    expect(data).toStrictEqual({ items: [0, 1] });
  });

  test("literal", () => {
    const schema = createSchema("test", {
      role: literal("admin", "moderator"),
    });

    // @ts-expect-error
    expect(() => schema.toData({})).toThrowError(
      "unknown value 'undefined', literal may only specify known values"
    );
    // @ts-expect-error
    expect(() => schema.toData({ role: "user" })).toThrowError(
      "unknown value 'user', literal may only specify known values"
    );
    const data = schema.toData({ role: "admin" });
    expect(data).toStrictEqual({ role: "admin" });
  });

  test("taggedUnion", () => {
    const schema = createSchema("test", {
      color: taggedUnion({
        rgba: object({ r: number(), g: number(), b: number(), a: string() }),
        hex: string(),
        hsl: tuple([string(), string(), string()]).transform(
          ([f, s, t]) => f + s + t
        ),
      }),
    });

    // @ts-expect-error
    expect(() => schema.toData({})).toThrowError(
      "expected 'object' received 'undefined'"
    );
    // @ts-expect-error
    expect(() => schema.toData({ color: {} })).toThrowError("missing field");
    // @ts-expect-error
    expect(() => schema.toData({ color: { tag: "hex" } })).toThrowError(
      "missing field 'value' in tagged union"
    );
    expect(() =>
      // @ts-expect-error
      schema.toData({ color: { value: "#fff" } })
    ).toThrowError("missing field 'tag' in tagged union");
    expect(() =>
      schema.toData({
        // @ts-expect-error
        color: { tag: "hex", value: "#fff", extra: "user" },
      })
    ).toThrowError(
      "unknown field 'extra', tagged union may only specify 'tag' and 'value' fields"
    );
    expect(() =>
      // @ts-expect-error
      schema.toData({ color: { tag: "hwb", value: "#fff" } })
    ).toThrowError("unknown tag 'hwb'");
    expect(() =>
      // @ts-expect-error
      schema.toData({ color: { tag: "hsl", value: "#fff" } })
    ).toThrowError("invalid value for tag 'hsl'");
    const data1 = schema.toData({
      color: { tag: "rgba", value: { r: 0, g: 0, b: 0, a: "100%" } },
    });
    expect(data1).toStrictEqual({
      color: { tag: "rgba", value: { r: 0, g: 0, b: 0, a: "100%" } },
    });
    const data2 = schema.toData({
      color: { tag: "hex", value: "#fff" },
    });
    expect(data2).toStrictEqual({
      color: { tag: "hex", value: "#fff" },
    });
    const data3 = schema.toData({
      color: { tag: "hsl", value: ["0", "0", "0"] },
    });
    expect(data3).toStrictEqual({
      color: { tag: "hsl", value: "000" },
    });
  });
});
