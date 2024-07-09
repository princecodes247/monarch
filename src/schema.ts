import type { MonarchType } from "./types/type";
import type {
  InferTypeObjectInput,
  InferTypeObjectOutput,
  InferTypeOutput,
  Merge,
  Pretty,
} from "./types/type-helpers";

type SchemaTransform<T extends Record<string, MonarchType<any>>> = {
  [K in keyof T]?: (value: InferTypeOutput<T[K]>) => any;
};
type InferSchemaTransform<T extends Record<string, (value: any) => any>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

type SchemaOmit<T extends Record<string, MonarchType<any>>> = {
  [K in keyof T]?: true;
};

type SchemaExtras<
  T extends Record<string, MonarchType<any>>,
  U extends Record<string, any>
> = (values: InferTypeObjectOutput<T>) => U;
type InferSchemaExtras<T extends (value: any) => any> = ReturnType<T>;

export type Schema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TTransform extends SchemaTransform<TTypes>,
  TOmit extends SchemaOmit<TTypes>,
  TExtras extends SchemaExtras<TTypes, Record<string, any>>
> = {
  name: TName;
  types: TTypes;
  options?: {
    transform?: TTransform;
    omit?: TOmit;
    extras?: TExtras;
  };
};
export type AnySchema = Schema<any, any, any, any, any>;

type InferSchemaOptions<T extends AnySchema> = T extends Schema<
  infer _Name,
  infer _Types,
  infer Transform,
  infer Omit,
  infer Extras
>
  ? {
      transform: Transform;
      omit: Omit;
      extras: Extras;
    }
  : never;

export function createSchema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TTransform extends SchemaTransform<TTypes>,
  TOmit extends SchemaOmit<TTypes>,
  TExtras extends SchemaExtras<TTypes, Record<string, any>>
>(
  name: TName,
  types: TTypes,
  options?: {
    transform?: TTransform;
    omit?: TOmit;
    extras?: TExtras;
  }
): Schema<TName, TTypes, TTransform, TOmit, TExtras> {
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
  Omit<
    Merge<
      InferTypeObjectOutput<T["types"]>,
      InferSchemaTransform<InferSchemaOptions<T>["transform"]>
    >,
    keyof InferSchemaOptions<T>["omit"]
  > &
    InferSchemaExtras<InferSchemaOptions<T>["extras"]>
>;

export function parseSchema<T extends AnySchema>(
  schema: T,
  input: InferSchemaInput<T>
): InferSchemaOutput<T> {
  const validated = {} as InferSchemaOutput<T>;
  const transformedOriginal = {} as Partial<InferSchemaOutput<T>>;

  for (const [key, type] of Object.entries(schema.types) as [
    keyof T["types"],
    MonarchType<any>
  ][]) {
    // omit field
    if (schema.options?.omit?.[key]) continue;

    // transform and add field
    const value = type._parser(input[key]);
    const transformer = schema.options?.transform?.[key];
    if (transformer) {
      validated[key] = transformer(value);
      transformedOriginal[key] = value;
    } else {
      validated[key] = value;
    }
  }

  // add extra fields
  const extras = schema.options?.extras?.({
    ...validated,
    ...transformedOriginal, // replace transformed fields with the original
  });
  if (extras) Object.assign(validated, extras);

  return validated;
}
