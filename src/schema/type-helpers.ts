import type { CreateIndexesOptions, IndexDirection, ObjectId } from "mongodb";
import type {
  IdFirst,
  KnownObjectKeys,
  Merge,
  Pretty,
  WithOptionalId,
  WithRequiredId,
} from "../type-helpers";
import type { AnyMonarchType } from "../types/type";
import type {
  InferTypeObjectInput,
  InferTypeObjectOutput,
} from "../types/type-helpers";
import type { AnySchema, Schema } from "./schema";

export type InferSchemaInput<T extends AnySchema> = Pretty<
  WithOptionalId<
    Merge<
      InferTypeObjectInput<T["types"]>,
      InferTypeObjectInput<T["relations"]>
    >
  >
>;
export type InferSchemaData<T extends AnySchema> = Pretty<
  WithRequiredId<
    Merge<
      InferTypeObjectOutput<T["types"]>,
      InferTypeObjectOutput<T["relations"]>
    >
  >
>;
export type InferSchemaOutput<T extends AnySchema> = Pretty<
  IdFirst<
    Merge<
      Omit<InferSchemaData<T>, InferSchemaOmit<T>>,
      KnownObjectKeys<InferSchemaVirtuals<T>>
    >
  >
>;
type InferSchemaOmit<T extends AnySchema> = T extends Schema<
  any,
  any,
  any,
  any,
  infer Omit
>
  ? keyof { [K in keyof Omit as Omit[K] extends true ? K : never]: unknown }
  : never;
type InferSchemaVirtuals<T extends AnySchema> = T extends Schema<
  any,
  any,
  any,
  infer Virtuals,
  any
>
  ? Virtuals
  : never;

export type CreateIndexesFields<T extends Record<string, AnyMonarchType>> = {
  [K in IndexKeys<InferTypeObjectOutput<T>> | "_id"]?:
    | 1
    | -1
    | Exclude<IndexDirection, number>;
};
export type SchemaIndex<T extends Record<string, AnyMonarchType>> =
  | [CreateIndexesFields<T>]
  | [CreateIndexesFields<T>, CreateIndexesOptions | undefined];
export type CreateIndex<T extends Record<string, AnyMonarchType>> = (
  fields: CreateIndexesFields<T>,
  options?: CreateIndexesOptions,
) => SchemaIndex<T>;
export type UniqueIndex<T extends Record<string, AnyMonarchType>> = (
  field: IndexKeys<InferTypeObjectOutput<T>>,
) => SchemaIndex<T>;

type IndexKeys<T, Prefix extends string = ""> = T extends Array<infer U>
  ? IndexKeys<U, Prefix>
  : T extends ObjectId
    ? never
    : T extends Record<string, any>
      ? keyof T extends infer K extends string
        ? KeysWithWildcard<K, Prefix> | SubKeys<T, K, Prefix>
        : never
      : never;
type SubKeys<T, K, Prefix extends string> = K extends keyof T & string
  ? IndexKeys<T[K], `${Prefix}${K}.`>
  : never;
type KeysWithWildcard<
  K extends string,
  Prefix extends string,
> = string extends K ? `${Prefix}$**` : `${Prefix}${K}` | `${Prefix}$**`;
