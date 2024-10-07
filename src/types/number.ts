import { MonarchParseError } from "../errors";
import { MonarchType, Scopes } from "./type";

export const number = () => new MonarchNumber();

export class MonarchNumber extends MonarchType<
  number,
  number,
  typeof Scopes.Default
> {
  constructor() {
    super((input) => {
      if (typeof input === "number") return input;
      throw new MonarchParseError(
        `expected 'number' received '${typeof input}'`,
      );
    }, Scopes.Default);
  }
}
