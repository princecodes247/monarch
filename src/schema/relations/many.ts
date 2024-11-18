import { MonarchParseError } from "../../errors";
import { MonarchType, pipeParser } from "../../types/type";
import {
  type AnySchema,
  type AnySchemaWithoutRelations,
  Schema,
} from "../schema";
import type { InferSchemaData, SchemaInputWithId } from "../type-helpers";
import { MonarchRelation } from "./base";
import type { SchemaRelatableField } from "./type-helpers";

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
    let parser = MonarchType.parser(targetTypes[_field]);
    // if field type is duplicated in current schema, validate first and pass the output to the target schema
    if (_field in schemaTypes) {
      parser = pipeParser(MonarchType.parser(schemaTypes[_field]), parser);
    }
    super((input) => {
      if (Array.isArray(input)) {
        const parsed = [] as InferSchemaData<TTarget>[TField][];
        for (const [index, value] of input.entries()) {
          try {
            parsed[index] = parser(value);
          } catch (error) {
            if (error instanceof MonarchParseError) {
              throw new MonarchParseError(
                `element at index '${index}' ${error.message}`,
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
  }
}
