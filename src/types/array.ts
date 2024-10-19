import { MonarchParseError } from "../errors";
import { type AnyMonarchSubType, MonarchType, Scopes } from "./type";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export const array = <T extends AnyMonarchSubType>(type: T) =>
  new MonarchArray(type);

export class MonarchArray<T extends AnyMonarchSubType> extends MonarchType<
  InferTypeInput<T>[],
  InferTypeOutput<T>[],
  typeof Scopes.Default
> {
  constructor(type: T) {
    super((input) => {
      if (Array.isArray(input)) {
        const parsed = [] as InferTypeOutput<T>[];
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
    }, Scopes.Default);
  }
}
