import {
  DefaultedSchema,
  InferSchemaInput,
  InferSchemaOutput,
  OptionalSchema,
  Schema,
} from "./base";

type Pretty<T> = { [K in keyof T]: T[K] } & {};

type IsOptionalSchema<T extends Schema<any>> = T extends OptionalSchema<any>
  ? true
  : T extends DefaultedSchema<any>
  ? true
  : false;

export type InferSchemaObjectInput<T extends Record<string, Schema<any>>> =
  Pretty<
    {
      [K in keyof T as IsOptionalSchema<T[K]> extends true
        ? never
        : K]: InferSchemaInput<T[K]>; // required keys
    } & {
      [K in keyof T as IsOptionalSchema<T[K]> extends true
        ? K
        : never]?: InferSchemaInput<T[K]>; // optional keys
    }
  >;

export type InferSchemaObjectOutput<T extends Record<string, Schema<any>>> =
  Pretty<{
    [K in keyof T]: InferSchemaOutput<T[K]>;
  }>;

export function parseSchema<T extends Record<string, Schema<any>>>(
  schema: T,
  input: InferSchemaObjectInput<T>
) {
  const validated = {} as InferSchemaObjectOutput<T>;

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const validatedValue = fieldSchema._parser.validate(input[field]);
    validated[field as keyof InferSchemaObjectOutput<T>] =
      fieldSchema._parser.transform(validatedValue);
  }

  return validated;
}
