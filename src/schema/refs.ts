import type { ObjectId } from "mongodb";
import { MonarchParseError } from "../errors";
import type { AnySchema, AnySchemaWithoutRelations } from "../schema/schema";
import type { InferSchemaInput } from "../schema/type-helpers";
import { objectId } from "../types/objectId";
import { MonarchMany, MonarchOne, MonarchRef } from "../types/refs";
import type { AnyMonarchRelationType, AnyMonarchType } from "../types/type";
import type { InferTypeInput, InferTypeOutput } from "../types/type-helpers";

export type ValidRelationField = string | number | ObjectId;
export type SchemaRelationField<T extends AnySchema> = keyof {
  [K in keyof InferSchemaInput<T> as NonNullable<
    InferSchemaInput<T>[K]
  > extends ValidRelationField
    ? K
    : never]: unknown;
};
export type SchemaRelationSelect<T extends AnySchema> = {
  [K in keyof T["relations"]]?: boolean;
};

export type SchemaRelationDef<T extends Record<string, AnyMonarchType>> = {
  [k: string]: AnyMonarchRelationType;
} & {
  [K in keyof T]?: AnyMonarchRelationType<
    InferTypeInput<T[K]>,
    InferTypeOutput<T[K]>
  >;
};

export class RelationsProvider<TSchema extends AnySchema>
  implements Relations<TSchema>
{
  constructor(protected schema: TSchema) {}

  public one: RelationsOne<TSchema> = (target, options) => {
    return new MonarchOne(this.schema, target, options, (input) => {
      const type =
        options.field === "_id"
          ? (target.types[options.field] ?? objectId())
          : target.types[options.field];
      const parsed = type._parser(input);
      return parsed;
    });
  };

  public many: RelationsMany<TSchema> = (target, options) => {
    return new MonarchMany(this.schema, target, options, (input) => {
      if (Array.isArray(input)) {
        const type =
          options.field === "_id"
            ? (target.types[options.field] ?? objectId())
            : target.types[options.field];
        const parsed = [];
        for (const [index, value] of input.entries()) {
          try {
            parsed[index] = type._parser(value);
          } catch (error) {
            if (error instanceof MonarchParseError) {
              throw new MonarchParseError(
                `element at index '${index}' ${error.message}'`,
              );
            }
            throw error;
          }
        }
        return parsed;
      }
      throw new MonarchParseError(
        `expected 'array' received '${typeof input}'`,
      );
    });
  };

  public ref: RelationsRef<TSchema> = (target, options) => {
    return new MonarchRef(this.schema, target, options);
  };
}

export type Relations<TSchema extends AnySchema> = {
  one: RelationsOne<TSchema>;
  many: RelationsMany<TSchema>;
  ref: RelationsRef<TSchema>;
};

export type RelationsOne<TSchema extends AnySchema> = <
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
>(
  target: TTarget,
  options: RelationsOneOptions<TSchema, TTarget, TField>,
) => MonarchOne<TSchema, TTarget, TField>;
type RelationsOneOptions<
  _TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
> = {
  field: TField;
};

export type RelationsMany<TSchema extends AnySchema> = <
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
>(
  target: TTarget,
  options: RelationsManyOptions<TSchema, TTarget, TField>,
) => MonarchMany<TSchema, TTarget, TField>;
type RelationsManyOptions<
  _TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
> = {
  field: TField;
};

export type RelationsRef<TSchema extends AnySchema> = <
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
  TReferences extends SchemaRelationField<TSchema>,
>(
  target: TTarget,
  options: RelationsRefOptions<TSchema, TTarget, TField, TReferences>,
) => MonarchRef<TSchema, TTarget, TField, TReferences>;
type RelationsRefOptions<
  TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
  TReferences extends SchemaRelationField<TSchema>,
> = {
  field: TField;
  references: TReferences;
};
