import { array } from "../../types/array";
import { objectId } from "../../types/objectId";
import { pipeParser } from "../../types/type";
import {
  type AnySchema,
  type AnySchemaWithoutRelations,
  Schema,
} from "../schema";
import type { InferSchemaData, InferSchemaTypes } from "../type-helpers";
import { MonarchRelation } from "./base";
import type { SchemaInputWithId, SchemaRelatableField } from "./type-helpers";

export class MonarchMany<
  TSchema extends AnySchema,
  TTarget extends AnySchemaWithoutRelations,
  TField extends SchemaRelatableField<TTarget>,
> extends MonarchRelation<
  SchemaInputWithId<TTarget>[TField][],
  InferSchemaData<TTarget>[TField][]
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
      type = objectId();
    }
    // if field type is duplicated in current schema, validate first and pass the output to the target schema
    if (_field in schemaTypes) {
      type = pipeParser(schemaTypes[_field], type);
    }
    const arrayType = array(type) as InferSchemaTypes<TTarget>[TField];
    super(arrayType);
  }
}
