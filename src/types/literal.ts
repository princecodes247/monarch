import { MonarchError } from "../errors";
import { MonarchType } from "./type";

export const literal = <T extends (string | number)[]>(...values: T) =>
  new MonarchLiteral(values);

class MonarchLiteral<T extends (string | number)[]> extends MonarchType<
  T[number]
> {
  constructor(values: T) {
    const _values = new Set(values);
    super({
      validate: (input: T[number]) => {
        if (_values.has(input)) {
          return input;
        }
        throw new MonarchError(`Invalid enum value: ${input}`);
      },
      transform: (input: T[number]) => input,
    });
  }
}
