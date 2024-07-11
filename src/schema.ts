import { MonarchType } from "./types/type";
import {
  InferTypeObjectInput,
  InferTypeObjectOutput,
  KnownObjectKeys,
  Merge,
  Pretty,
} from "./types/type-helpers";

import { CreateIndexesOptions, IndexDirection } from "mongodb";

type SchemaOmit<T extends keyof any> = { [K in T]?: true };

type SchemaVirtuals<
  T extends Record<string, MonarchType<any>>,
  U extends Record<string, any>
> = (values: InferTypeObjectOutput<T>) => U;

type SchemaIndexes<T extends Record<string, MonarchType<any>>> = (options: {
  createIndex: CreateIndex<keyof T>;
}) => {
  [k: string]:
    | [fields: CreateIndexesFields<keyof T>]
    | [fields: CreateIndexesFields<keyof T>, options: CreateIndexesOptions];
};

type CreateIndex<T extends keyof any> = (
  fields: CreateIndexesFields<T>,
  options?: CreateIndexesOptions
) => [CreateIndexesFields<T>, CreateIndexesOptions | undefined];
type CreateIndexesFields<T extends keyof any> = {
  [K in T]?: 1 | -1 | Exclude<IndexDirection, number>;
};

export type Schema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TOmit extends keyof TTypes,
  TVirtuals extends Record<string, any>
> = {
  name: TName;
  types: TTypes;
  options?: {
    omit?: SchemaOmit<TOmit>;
    virtuals?: SchemaVirtuals<TTypes, TVirtuals>;
    indexes?: SchemaIndexes<TTypes>;
  };
};
export type AnySchema = Schema<any, any, any, any>;

type InferSchemaOptions<T extends AnySchema> = T extends Schema<
  infer _Name,
  infer _Types,
  infer Omit,
  infer Extras
>
  ? {
      omit: Omit;
      virtuals: Extras;
    }
  : never;

export function createSchema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TOmit extends keyof TTypes = never,
  TVirtuals extends Record<string, any> = {}
>(
  name: TName,
  types: TTypes,
  options?: {
    omit?: SchemaOmit<TOmit>;
    virtuals?: SchemaVirtuals<TTypes, TVirtuals>;
    indexes?: SchemaIndexes<TTypes>;
  }
): Schema<TName, TTypes, TOmit, TVirtuals> {
  return {
    name,
    types,
    options,
  };
}

export type InferSchemaInput<T extends AnySchema> = InferTypeObjectInput<
  T["types"]
>;
export type InferSchemaOutput<T extends AnySchema> = Pretty<
  Merge<
    Omit<InferTypeObjectOutput<T["types"]>, InferSchemaOptions<T>["omit"]>,
    KnownObjectKeys<InferSchemaOptions<T>["virtuals"]>
  >
>;

export function parseSchema<T extends AnySchema>(
  schema: T,
  input: InferSchemaInput<T>
): InferSchemaOutput<T> {
  const validated = {} as InferSchemaOutput<T>;

  for (const [key, type] of Object.entries(schema.types) as [
    keyof T["types"],
    MonarchType<any>
  ][]) {
    // omit field
    if (schema.options?.omit?.[key]) continue;

    // transform and add field
    const value = type._parser(input[key]);
    validated[key] = value;
  }

  // add virtual fields
  if (schema.options?.virtuals) {
    Object.assign(validated, schema.options.virtuals(validated));
  }

  return validated;
}
