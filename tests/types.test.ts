import { describe, expect, it, test, vi } from "vitest";
import { string } from "../src";
import { createSchema, parseSchema } from "../src/schema";
import { type } from "../src/types/type";

const numberString = () => type<number, `${number}`>((input) => `${input}`);

describe("Types", () => {
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
});
