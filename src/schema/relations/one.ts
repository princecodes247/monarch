import { MonarchType, pipeParser } from "../../types/type";
import {
  type AnySchema,
  type AnySchemaWithoutRelations,
  Schema,
} from "../schema";
import type { InferSchemaData, SchemaInputWithId } from "../type-helpers";
import { MonarchRelation } from "./base";
import type { SchemaRelatableField } from "./type-helpers";

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
    let parser = MonarchType.parser(targetTypes[_field]);
    // if field type is duplicated in current schema, validate first and pass the output to the target schema
    if (_field in schemaTypes) {
      parser = pipeParser(MonarchType.parser(schemaTypes[_field]), parser);
    }
    super(parser);
  }
}
