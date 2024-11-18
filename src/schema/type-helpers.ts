import type { CreateIndexesOptions, IndexDirection, ObjectId } from "mongodb";
import type {
  IdFirst,
  Merge,
  Pretty,
  TrueKeys,
  WithOptionalId,
  WithRequiredId,
  WithRequiredObjectId,
} from "../type-helpers";
import type { AnyMonarchType } from "../types/type";
import type {
  _InferTypeObjectInput,
  _InferTypeObjectOutput,
} from "../types/type-helpers";
import type {
  InferRelationObjectInput,
  InferRelationObjectOutput,
} from "./relations/type-helpers";
import type { AnySchema, Schema } from "./schema";
import type { InferVirtualOutput } from "./virtuals";

export type SchemaInputWithId<T extends AnySchema> = WithRequiredId<
  _InferTypeObjectInput<InferSchemaTypes<T>>
>;

export type InferSchemaInput<T extends AnySchema> = Pretty<
  WithOptionalId<
    Merge<
      _InferTypeObjectInput<InferSchemaTypes<T>>,
      InferRelationObjectInput<InferSchemaRelations<T>>
    >
  >
>;
export type _InferSchemaData<T extends AnySchema> = WithRequiredObjectId<
  Merge<
    _InferTypeObjectOutput<InferSchemaTypes<T>>,
    InferRelationObjectOutput<InferSchemaRelations<T>>
  >
>;
export type InferSchemaData<T extends AnySchema> = Pretty<_InferSchemaData<T>>;
export type InferSchemaOutput<T extends AnySchema> = Pretty<
  IdFirst<
    Merge<_InferSchemaData<T>, InferVirtualOutput<InferSchemaVirtuals<T>>>
  >
>;

export type InferSchemaTypes<T extends AnySchema> = T extends Schema<
  infer _TName,
  infer TTypes,
  infer _TRelations,
  infer _TOmit,
  infer _TVirtuals
>
  ? TTypes
  : never;
export type InferSchemaRelations<T extends AnySchema> = T extends Schema<
  infer _TName,
  infer _TTypes,
  infer TRelations,
  infer _TOmit,
  infer _TVirtuals
>
  ? TRelations
  : never;
export type InferSchemaOmit<T extends AnySchema> = T extends Schema<
  infer _TName,
  infer _TTypes,
  infer _TRelations,
  infer TOmit,
  infer _TVirtuals
>
  ? TrueKeys<TOmit>
  : never;
export type InferSchemaVirtuals<T extends AnySchema> = T extends Schema<
  infer _TName,
  infer _TTypes,
  infer _TRelations,
  infer _TOmit,
  infer TVirtuals
>
  ? TVirtuals
  : never;

export type CreateIndexesFields<T extends Record<string, AnyMonarchType>> = {
  [K in IndexKeys<_InferTypeObjectOutput<T>> | "_id"]?:
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
  field: IndexKeys<_InferTypeObjectOutput<T>>,
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
