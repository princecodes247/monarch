import {
  type AnySchema,
  type AnySchemaWithoutRelations,
  Schema,
} from "../schema/schema";
import type { InferSchemaData, InferSchemaTypes } from "../schema/type-helpers";
import { objectId } from "../types/objectId";
import { applyParser } from "../types/type";
import { MonarchRelation } from "./base";
import type { SchemaInputWithId, SchemaRelatableField } from "./type-helpers";

export class MonarchOne<
  TSchema extends AnySchema,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
> extends MonarchRelation<
  SchemaInputWithId<TTarget>[TField],
  InferSchemaData<TTarget>[TField]
> {
  constructor(
    public _schema: TSchema,
    public _target: TTarget,
    public _field: TField,
  ) {
    const targetTypes = Schema.types(_target);
    const schemaTypes = Schema.types(_schema);
    let type = targetTypes[_field];
    // parse relation input to implicit objectId field "_id"
    if (!type && _field === "_id") {
      type = objectId() as InferSchemaTypes<TTarget>[TField];
    }
    // if field type is duplicated in current schema, validate first and pass the output to the target schema
    if (_field in schemaTypes) {
      type = applyParser(schemaTypes[_field], type);
    }
    super(type);
  }
}
