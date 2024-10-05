import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export const record = <T extends MonarchType<any>>(type: T) => {
  return new MonarchRecord<T>((input) => {
    if (typeof input === "object" && input !== null) {
      const parsed = {} as Record<string, InferTypeOutput<T>>;
      for (const [key, value] of Object.entries(input)) {
        try {
          parsed[key] = type._parser(value);
        } catch (error) {
          if (error instanceof MonarchParseError) {
            throw new MonarchParseError(`field '${key}' ${error.message}'`);
          }
          throw error;
        }
      }
      return parsed;
    }
    throw new MonarchParseError(`expected 'object' received '${typeof input}'`);
  });
};

class MonarchRecord<T extends MonarchType<any>> extends MonarchType<
  Record<string, InferTypeInput<T>>,
  Record<string, InferTypeOutput<T>>
> {}
