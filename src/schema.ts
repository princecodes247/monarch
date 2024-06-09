import type { MonarchType } from "./types/type";
import type {
  InferTypeObjectInput,
  InferTypeObjectOutput,
} from "./types/type-helpers";

export type Schema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>
> = {
  name: TName;
  types: TTypes;
};

export function createSchema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>
>(name: TName, types: TTypes): Schema<TName, TTypes> {
  return {
    name,
    types,
  };
}

export type InferSchemaInput<T extends Schema<any, any>> = InferTypeObjectInput<
  T["types"]
>;
export type InferSchemaOutput<T extends Schema<any, any>> =
  InferTypeObjectOutput<T["types"]>;

export function parseSchema<T extends Schema<any, any>>(
  schema: T,
  input: InferSchemaInput<T>
): InferSchemaOutput<T> {
  const validated = {} as InferSchemaOutput<T>;

  for (const [key, type] of Object.entries(schema.types) as [
    keyof T["types"],
    MonarchType<any>
  ][]) {
    validated[key] = type._parser(input[key]);
  }

  return validated;
}
