import { InferTypeInput, InferTypeOutput, MonarchType } from "./types/type";

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

type Pretty<T> = { [K in keyof T]: T[K] } & {};
export type InferSchemaInput<T extends Schema<any, any>> = Pretty<
  {
    [K in keyof T["types"] as undefined extends InferTypeInput<T["types"][K]>
      ? never
      : K]: InferTypeInput<T["types"][K]>; // required keys
  } & {
    [K in keyof T["types"] as undefined extends InferTypeInput<T["types"][K]>
      ? K
      : never]?: InferTypeInput<T["types"][K]>; // optional keys
  }
>;
export type InferSchemaOutput<T extends Schema<any, any>> = Pretty<{
  [K in keyof T["types"]]: InferTypeOutput<T["types"][K]>;
}>;

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
