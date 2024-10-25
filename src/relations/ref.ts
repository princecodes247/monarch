import type { AnySchema, AnySchemaWithoutRelations } from "../schema/schema";
import type { InferSchemaData } from "../schema/type-helpers";
import { type MonarchPhantom, phantom, type } from "../types/type";
import { MonarchRelation } from "./base";
import type { SchemaRelatableField } from "./type-helpers";

export class MonarchRef<
  TSchema extends AnySchema,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
  TReferences extends keyof InferSchemaData<TSchema>,
> extends MonarchRelation<undefined, MonarchPhantom> {
  constructor(
    public _schema: TSchema,
    public _target: TTarget,
    public _field: TField,
    public _references: TReferences,
  ) {
    super(type(() => phantom));
  }
}
