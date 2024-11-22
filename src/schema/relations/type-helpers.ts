import type { ObjectId } from "mongodb";
import type { Index } from "../../type-helpers";
import type { MonarchPhantom } from "../../types/type";
import type { AnySchema } from "../schema";
import type {
  InferSchemaOutput,
  InferSchemaRelations,
  SchemaInputWithId,
} from "../type-helpers";
import type {
  AnyMonarchRelation,
  MonarchNullableRelation,
  MonarchOptionalRelation,
  MonarchRelation,
} from "./base";
import type { MonarchMany } from "./many";
import type { MonarchOne } from "./one";
import type { MonarchRef } from "./ref";

type ValidRelationFieldType = string | number | ObjectId;
export type SchemaRelatableField<T extends AnySchema> = keyof {
  [K in keyof SchemaInputWithId<T> as NonNullable<
    SchemaInputWithId<T>[K]
  > extends ValidRelationFieldType
    ? K
    : never]: unknown;
};

export type SchemaRelationSelect<T extends AnySchema> = {
  // TODO: support relation filters and projections
  [K in keyof InferSchemaRelations<T>]?: true;
};

export type InferRelationInput<T> = T extends MonarchRelation<infer TInput, any>
  ? TInput
  : never;
export type InferRelationOutput<T> = T extends MonarchRelation<
  any,
  infer TOutput
>
  ? TOutput
  : never;

export type InferRelationObjectInput<
  T extends Record<string, AnyMonarchRelation>,
> = {
  [K in keyof T as undefined extends InferRelationInput<T[K]>
    ? never
    : K]: InferRelationInput<T[K]>; // required keys
} & {
  [K in keyof T as undefined extends InferRelationInput<T[K]>
    ? InferRelationOutput<T[K]> extends MonarchPhantom
      ? never
      : K
    : never]?: InferRelationInput<T[K]>; // optional keys
};
export type InferRelationObjectOutput<
  T extends Record<string, AnyMonarchRelation>,
> = {
  [K in keyof T as InferRelationOutput<T[K]> extends MonarchPhantom
    ? never
    : K]: InferRelationOutput<T[K]>;
};

export type InferRelationPopulation<T> = T extends MonarchOne<
  any,
  infer TTarget,
  any
>
  ? InferSchemaOutput<TTarget>
  : T extends MonarchMany<any, infer TTarget, any>
    ? InferSchemaOutput<TTarget>[]
    : T extends MonarchRef<any, infer TTarget, any, any>
      ? InferSchemaOutput<TTarget>[]
      : T extends MonarchOptionalRelation<infer TRelation>
        ? InferRelationPopulation<TRelation>
        : T extends MonarchNullableRelation<infer TRelation>
          ? InferRelationPopulation<TRelation>
          : never;

export type InferRelationPopulationObject<
  T extends AnySchema,
  Keys extends keyof any,
> = {
  [K in Keys]: InferRelationPopulation<Index<InferSchemaRelations<T>, K>>;
};
