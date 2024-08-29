import { CreateIndexesOptions, IndexDirection } from "mongodb";
import {
  KnownObjectKeys,
  Merge,
  Pretty,
  WithOptionalId,
  WithRequiredId,
} from "../type-helpers";
import { MonarchType } from "../types/type";
import {
  InferTypeObjectInput,
  InferTypeObjectOutput,
} from "../types/type-helpers";
import { AnySchema, Schema } from "./schema";

export type InferSchemaInput<T extends AnySchema> = Pretty<
  WithOptionalId<InferTypeObjectInput<T["types"]>>
>;
export type InferSchemaData<T extends AnySchema> = Pretty<
  WithRequiredId<InferTypeObjectOutput<T["types"]>>
>;
export type InferSchemaOutput<T extends AnySchema> = Pretty<
  Omit<WithRequiredId<{}>, InferSchemaOptions<T>["omit"]> & // places _id as the first field in the object if it is not ommitted
    Merge<
      Omit<InferSchemaData<T>, InferSchemaOptions<T>["omit"]>,
      KnownObjectKeys<InferSchemaOptions<T>["virtuals"]>
    >
>;
type InferSchemaOptions<T extends AnySchema> = T extends Schema<
  infer _Name,
  infer _Types,
  infer Virtuals,
  infer Omit
>
  ? {
      virtuals: Virtuals;
      omit: Omit;
    }
  : never;

export type CreateIndexesFields<T extends Record<string, MonarchType<any>>> = {
  [K in IndexKeys<InferTypeObjectOutput<T>> | "_id"]?:
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
