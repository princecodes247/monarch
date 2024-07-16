import { CreateIndexesOptions, IndexDirection } from "mongodb";
import { KnownObjectKeys, Merge, Pretty } from "../type-helpers";
import { MonarchType } from "../types/type";
import {
  InferTypeObjectInput,
  InferTypeObjectOutput,
} from "../types/type-helpers";
import { AnySchema, Schema } from "./schema";

export type InferSchemaInput<T extends AnySchema> = InferTypeObjectInput<
  T["types"]
>;
export type InferSchemaOutput<T extends AnySchema> = Pretty<
  Merge<
    Omit<InferTypeObjectOutput<T["types"]>, InferSchemaOptions<T>["omit"]>,
    KnownObjectKeys<InferSchemaOptions<T>["virtuals"]>
  >
>;
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

export type CreateIndexesFields<T extends Record<string, MonarchType<any>>> = {
  [K in IndexKeys<InferTypeObjectOutput<T>>]?:
    | 1
    | -1
    | Exclude<IndexDirection, number>;
};
export type SchemaIndex<T extends Record<string, MonarchType<any>>> =
  | [CreateIndexesFields<T>]
  | [CreateIndexesFields<T>, CreateIndexesOptions | undefined];
export type CreateIndex<T extends Record<string, MonarchType<any>>> = (
  fields: CreateIndexesFields<T>,
  options?: CreateIndexesOptions
) => SchemaIndex<T>;
export type UniqueIndex<T extends Record<string, MonarchType<any>>> = (
  field: IndexKeys<InferTypeObjectOutput<T>>
) => SchemaIndex<T>;

type IndexKeys<T, Prefix extends string = ""> = T extends Array<infer U>
  ? IndexKeys<U, Prefix>
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
  Prefix extends string
> = string extends K ? `${Prefix}$**` : `${Prefix}${K}` | `${Prefix}$**`;
