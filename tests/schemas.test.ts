import { describe, expect, it, test, vi } from "vitest";
import { noopParser, schema } from "../src/schemas/base";
import { parseSchema } from "../src/schemas/parse";

const genericStringSchema = () => schema(noopParser<string>());
const genericNumberStringSchema = () =>
  schema<number, `${number}`>({
    validate: (input) => input,
    transform: (input) => `${input}`,
  });

describe("Schemas", () => {
  it("validates and transforms input", () => {
    const schema = {
      name: genericStringSchema(),
      upperName: genericStringSchema().transform((input) =>
        input.toUpperCase()
      ),
      age: genericNumberStringSchema(),
    };

    const output = parseSchema(schema, {
      name: "tom",
      upperName: "tom",
      age: 0,
    });
    expect(output).toStrictEqual({ name: "tom", upperName: "TOM", age: "0" });
  });

  test("optional, nullable and default", () => {
    // transform is ommited when value is null
    const schema1 = {
      age: genericNumberStringSchema().nullable(),
    };
    const output1 = parseSchema(schema1, { age: null });
    expect(output1).toStrictEqual({ age: null });

    // transform is applied when value is passed
    const schema2 = {
      age: genericNumberStringSchema().nullable(),
    };
    const output2 = parseSchema(schema2, { age: 0 });
    expect(output2).toStrictEqual({ age: "0" });

    // default value is used when ommited
    const defaultFnTrap1 = vi.fn(() => 11);
    const schema3 = {
      age: genericNumberStringSchema().default(10),
      ageLazy: genericNumberStringSchema().default(defaultFnTrap1),
    };
    const output3 = parseSchema(schema3, {});
    expect(output3).toStrictEqual({ age: "10", ageLazy: "11" });
    expect(defaultFnTrap1).toHaveBeenCalledTimes(1);

    // default value is ignored when value is passed
    const defaultFnTrap2 = vi.fn(() => 11);
    const schema4 = {
      age: genericNumberStringSchema().default(10),
      ageLazy: genericNumberStringSchema().default(defaultFnTrap2),
    };
    const output4 = parseSchema(schema4, { age: 1, ageLazy: 2 });
    expect(output4).toStrictEqual({ age: "1", ageLazy: "2" });
    expect(defaultFnTrap2).toHaveBeenCalledTimes(0);
  });
});
