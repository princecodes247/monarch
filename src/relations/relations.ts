import type { AnySchema, AnySchemaWithoutRelations } from "../schema/schema";
import type { InferSchemaData } from "../schema/type-helpers";
import { MonarchMany } from "./many";
import { MonarchOne } from "./one";
import { MonarchRef } from "./ref";
import type { SchemaRelatableField } from "./type-helpers";

export function relations<TSchema extends AnySchema>(
  schema: TSchema,
): Relations<TSchema> {
  return {
    one(target, field) {
      return new MonarchOne(schema, target, field);
    },
    many(target, field) {
      return new MonarchMany(schema, target, field);
    },
    ref(target, field, references) {
      return new MonarchRef(schema, target, field, references);
    },
  };
}

export type Relations<TSchema extends AnySchema> = {
  one: One<TSchema>;
  many: Many<TSchema>;
  ref: Ref<TSchema>;
};

type One<TSchema extends AnySchema> = <
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
>(
  target: TTarget,
  field: TField,
) => MonarchOne<TSchema, TTarget, TField>;

type Many<TSchema extends AnySchema> = <
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
>(
  target: TTarget,
  field: TField,
) => MonarchMany<TSchema, TTarget, TField>;

type Ref<TSchema extends AnySchema> = <
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
  TReferences extends keyof InferSchemaData<TSchema>,
>(
  target: TTarget,
  field: TField,
  references: TReferences,
) => MonarchRef<TSchema, TTarget, TField, TReferences>;
