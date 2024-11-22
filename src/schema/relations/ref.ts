import { type MonarchPhantom, phantom } from "../../types/type";
import type { AnySchema, AnySchemaWithoutRelations } from "../schema";
import type { InferSchemaData } from "../type-helpers";
import { MonarchRelation } from "./base";
import type { SchemaRelatableField } from "./type-helpers";

export class MonarchRef<
  TSchema extends AnySchema,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
  TReferences extends keyof InferSchemaData<TSchema>,
> extends MonarchRelation<undefined, MonarchPhantom> {
  private _tag = "ref";

  constructor(
    public _schema: TSchema,
    public _target: TTarget,
    public _field: TField,
    public _references: TReferences,
  ) {
    super(() => phantom);
  }
}
