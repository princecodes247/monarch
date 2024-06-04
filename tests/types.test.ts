import { describe, expect, it, test, vi } from "vitest";
import { boolean, number, object, record, string } from "../src";
import { createSchema, parseSchema } from "../src/schema";
import { type } from "../src/types/type";

const numberString = () => type<number, `${number}`>((input) => `${input}`);

describe("Types", () => {
  it("validates and transforms input", () => {
    const schema = createSchema("users", {
      name: string(),
      upperName: string().transform((input) => input.toUpperCase()),
      age: numberString(),
    });

    const output = parseSchema(schema, {
      name: "tom",
      upperName: "tom",
      age: 0,
    });
    expect(output).toStrictEqual({ name: "tom", upperName: "TOM", age: "0" });
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
    expect(() => parseSchema(schema, { name: "somename" })).not.toThrowError();
  });

  test("nullable", () => {
    // transform is skipped when value is null
    const schema1 = createSchema("users", {
      age: numberString().nullable(),
    });
    const output1 = parseSchema(schema1, { age: null });
    expect(output1).toStrictEqual({ age: null });

    // transform is applied when value is not null
    const schema2 = createSchema("users", {
      age: numberString().nullable(),
    });
    const output2 = parseSchema(schema2, { age: 0 });
    expect(output2).toStrictEqual({ age: "0" });
  });

  test("optional", () => {
    // transform is skipped when value is undefined
    const schema1 = createSchema("users", {
      age: numberString().optional(),
    });
    const output1 = parseSchema(schema1, {});
    expect(output1).toStrictEqual({ age: undefined });

    // transform is applied when value is not undefined
    const schema2 = createSchema("users", {
      age: numberString().optional(),
    });
    const output2 = parseSchema(schema2, { age: 0 });
    expect(output2).toStrictEqual({ age: "0" });
  });

  test("default", () => {
    // default value is used when value is ommited
    const defaultFnTrap1 = vi.fn(() => 11);
    const schema1 = createSchema("users", {
      age: numberString().default(10),
      ageLazy: numberString().default(defaultFnTrap1),
    });
    const output1 = parseSchema(schema1, {});
    expect(output1).toStrictEqual({ age: "10", ageLazy: "11" });
    expect(defaultFnTrap1).toHaveBeenCalledTimes(1);

    // default value is ignored when value is not null or undefined
    const defaultFnTrap2 = vi.fn(() => 11);
    const schema2 = createSchema("users", {
      age: numberString().default(10),
      ageLazy: numberString().default(defaultFnTrap2),
    });
    const output2 = parseSchema(schema2, { age: 1, ageLazy: 2 });
    expect(output2).toStrictEqual({ age: "1", ageLazy: "2" });
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
    const output1 = parseSchema(schema1, { count: "1" });
    expect(output1).toStrictEqual({ count: "count-1000" });
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
    const output2 = parseSchema(schema2, {});
    expect(output2).toStrictEqual({ count: "count-2000" });
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
    const output3 = parseSchema(schema3, {});
    expect(output3).toStrictEqual({ count: "count-3000" });
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
    const output4 = parseSchema(schema4, {});
    expect(output4).toStrictEqual({ count: "count-4000" });
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
        role: string(),
      }),
    });

    // @ts-expect-error
    expect(() => parseSchema(schema, {})).toThrowError(
      "expected 'object' received 'undefined'"
    );
    expect(() =>
      // @ts-expect-error
      parseSchema(schema, { permissions: { canUpdate: "yes" } })
    ).toThrowError("field 'canUpdate' expected 'boolean' received 'string'");
    // fields are validates in the order they are registered in type
    expect(() =>
      // @ts-expect-error
      parseSchema(schema, { permissions: { role: false } })
    ).toThrowError("field 'canUpdate' expected 'boolean' received 'undefined'");
    const res = parseSchema(schema, {
      permissions: { canUpdate: true, role: "moderator" },
    });
    expect(res).toStrictEqual({
      permissions: { canUpdate: true, canDelete: false, role: "moderator" },
    });
  });

  test("record", () => {
    const schema = createSchema("test", {
      grades: record(number()),
    });

    // @ts-expect-error
    expect(() => parseSchema(schema, {})).toThrowError(
      "expected 'object' received 'undefined'"
    );
    expect(() => parseSchema(schema, { grades: {} })).not.toThrowError();
    expect(() =>
      // @ts-expect-error
      parseSchema(schema, { grades: { math: "50" } })
    ).toThrowError("field 'math' expected 'number' received 'string'");
    const res = parseSchema(schema, { grades: { math: 50 } });
    expect(res).toStrictEqual({ grades: { math: 50 } });
  });
});
