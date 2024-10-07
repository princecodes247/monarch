import type { SchemaRelationField } from "../schema/refs";
import type { AnySchemaWithoutRelations } from "../schema/schema";
import type { InferSchemaInput } from "../schema/type-helpers";
import { MonarchPhantom, MonarchType, type Parser, Scopes } from "./type";

export class MonarchOne<
  TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
> extends MonarchType<
  NonNullable<InferSchemaInput<TTarget>[TField]>,
  NonNullable<InferSchemaInput<TTarget>[TField]>,
  typeof Scopes.Relation
> {
  constructor(
    private schema: TSchema,
    private target: TTarget,
    private options: MonarchOneOptions<TSchema, TTarget, TField>,
    public _parser: Parser<
      NonNullable<InferSchemaInput<TTarget>[TField]>,
      NonNullable<InferSchemaInput<TTarget>[TField]>
    >,
  ) {
    super(_parser, Scopes.Relation);
  }
}
export type MonarchOneOptions<
  _TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
> = {
  field: TField;
};

export class MonarchMany<
  TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
> extends MonarchType<
  NonNullable<InferSchemaInput<TTarget>[TField]>[],
  NonNullable<InferSchemaInput<TTarget>[TField]>[],
  typeof Scopes.Relation
> {
  constructor(
    private schema: TSchema,
    private target: TTarget,
    private options: MonarchManyOptions<TSchema, TTarget, TField>,
    public _parser: Parser<
      NonNullable<InferSchemaInput<TTarget>[TField]>[],
      NonNullable<InferSchemaInput<TTarget>[TField]>[]
    >,
  ) {
    super(_parser, Scopes.Relation);
  }
}
export type MonarchManyOptions<
  _TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
> = {
  field: TField;
};

export class MonarchRef<
  TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
  TReferences extends SchemaRelationField<TSchema>,
> extends MonarchPhantom<
  { input: true; output: true },
  typeof Scopes.Relation
> {
  constructor(
    private schema: TSchema,
    private target: TTarget,
    private options: MonarchRefOptions<TSchema, TTarget, TField, TReferences>,
  ) {
    super({ input: true, output: true }, Scopes.Relation);
  }
}
export type MonarchRefOptions<
  TSchema extends AnySchemaWithoutRelations,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelationField<TTarget>,
  TReferences extends SchemaRelationField<TSchema>,
> = {
  field: TField;
  references: TReferences;
};
