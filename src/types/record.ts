import { MonarchParseError } from "../errors";
import { type AnyMonarchSubType, MonarchType, Scopes } from "./type";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export const record = <T extends AnyMonarchSubType>(type: T) =>
  new MonarchRecord(type);

export class MonarchRecord<T extends AnyMonarchSubType> extends MonarchType<
  Record<string, InferTypeInput<T>>,
  Record<string, InferTypeOutput<T>>,
  typeof Scopes.Default
> {
  constructor(type: T) {
    super((input) => {
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
      throw new MonarchParseError(
        `expected 'object' received '${typeof input}'`,
      );
    }, Scopes.Default);
  }
}
