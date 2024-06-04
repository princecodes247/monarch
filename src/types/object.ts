import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";
import { InferTypeObjectInput, InferTypeObjectOutput } from "./type-helpers";

export const object = <T extends Record<string, MonarchType<any>>>(
  types: T
) => {
  return new MonarchObject<T>((input) => {
    if (typeof input === "object" && input !== null) {
      const parsed = {} as InferTypeObjectOutput<T>;
      for (const [key, value] of Object.entries(types) as [
        keyof T & string,
        T[keyof T]
      ][]) {
        try {
          parsed[key] = value._parser(input[key as keyof typeof input]);
        } catch (error) {
          if (error instanceof MonarchParseError) {
            throw new MonarchParseError(
              `object field '${key}' ${error.message}'`
            );
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
