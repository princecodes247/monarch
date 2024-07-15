import { MonarchType } from "../types/type";
import { InferTypeObjectOutput } from "../types/type-helpers";
import {
  CreateIndex,
  InferSchemaInput,
  InferSchemaOutput,
  SchemaIndex,
  UniqueIndex,
} from "./type-helpers";

type SchemaOmit<T extends keyof any> = { [K in T]?: true };

type SchemaVirtuals<
  T extends Record<string, MonarchType<any>>,
  U extends Record<string, any>
> = (values: InferTypeObjectOutput<T>) => U;

type SchemaIndexes<T extends Record<string, MonarchType<any>>> = (options: {
  createIndex: CreateIndex<T>;
  unique: UniqueIndex<T>;
}) => { [k: string]: SchemaIndex<T> };

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
