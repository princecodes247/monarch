import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export const array = <T extends MonarchType<any>>(type: T) => {
  return new MonarchArray<T>((input) => {
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
    throw new MonarchParseError(`expected 'array' received '${typeof input}'`);
  });
};

class MonarchArray<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T>[],
  InferTypeOutput<T>[]
> {}
