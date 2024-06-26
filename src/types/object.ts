import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";
import { InferTypeObjectInput, InferTypeObjectOutput } from "./type-helpers";

export const object = <T extends Record<string, MonarchType<any>>>(
  types: T
) => {
  return new MonarchObject<T>((input) => {
    if (typeof input === "object" && input !== null) {
      for (const key of Object.keys(input)) {
        if (!(key in types)) {
          throw new MonarchParseError(
            `unknown field '${key}', object may only specify known fields`
          );
        }
      }
      const parsed = {} as InferTypeObjectOutput<T>;
      for (const [key, type] of Object.entries(types) as [
        keyof T & string,
        T[keyof T]
      ][]) {
        try {
          parsed[key] = type._parser(input[key as keyof typeof input]);
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

class MonarchObject<
  T extends Record<string, MonarchType<any>>
> extends MonarchType<InferTypeObjectInput<T>, InferTypeObjectOutput<T>> {}
