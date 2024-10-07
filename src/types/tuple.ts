import { MonarchParseError } from "../errors";
import { type AnyMonarchSubType, MonarchType, Scopes } from "./type";
import type { InferTypeTupleInput, InferTypeTupleOutput } from "./type-helpers";

export const tuple = <T extends [AnyMonarchSubType, ...AnyMonarchSubType[]]>(
  types: T,
) => {
  return new MonarchTuple(types);
};

export class MonarchTuple<
  T extends [AnyMonarchSubType, ...AnyMonarchSubType[]],
> extends MonarchType<
  InferTypeTupleInput<T>,
  InferTypeTupleOutput<T>,
  typeof Scopes.Default
> {
  constructor(types: T) {
    super((input) => {
      if (Array.isArray(input)) {
        if (input.length > types.length) {
          throw new MonarchParseError(
            `expected array with ${types.length} elements received ${input.length} elements`,
          );
        }
        const parsed = [] as InferTypeTupleOutput<T>;
        for (const [index, type] of types.entries()) {
          try {
            parsed[index] = type._parser(input[index]);
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
    }, Scopes.Default);
  }
}
