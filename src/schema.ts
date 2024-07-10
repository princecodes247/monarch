import type { MonarchType } from "./types/type";
import type {
  InferTypeObjectInput,
  InferTypeObjectOutput,
  KnownObjectKeys,
  Merge,
  Pretty,
} from "./types/type-helpers";

type SchemaOmit<T extends Record<string, MonarchType<any>>> = {
  [K in keyof T]?: true;
};
type InferSchemaOmit<T> = keyof {
  [K in keyof T as T[K] extends true ? K : never]: unknown;
};

type SchemaVirtuals<
  T extends Record<string, MonarchType<any>>,
  U extends Record<string, any>
> = (values: InferTypeObjectOutput<T>) => U;
type InferSchemaVirtuals<T extends (value: any) => any> = ReturnType<T>;

export type Schema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TOmit extends SchemaOmit<TTypes>,
  TVirtuals extends SchemaVirtuals<TTypes, Record<string, any>>
> = {
  name: TName;
  types: TTypes;
  options?: {
    omit?: TOmit;
    virtuals?: TVirtuals;
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
  TOmit extends SchemaOmit<TTypes>,
  TVirtuals extends SchemaVirtuals<TTypes, Record<string, any>>
>(
  name: TName,
  types: TTypes,
  options?: {
    omit?: TOmit;
    virtuals?: TVirtuals;
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
    Omit<
      InferTypeObjectOutput<T["types"]>,
      InferSchemaOmit<InferSchemaOptions<T>["omit"]>
    >,
    KnownObjectKeys<InferSchemaVirtuals<InferSchemaOptions<T>["virtuals"]>>
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
