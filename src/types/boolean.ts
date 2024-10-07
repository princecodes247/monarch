import { MonarchParseError } from "../errors";
import { MonarchType, Scopes } from "./type";

export const boolean = () => new MonarchBoolean();

export class MonarchBoolean extends MonarchType<
  boolean,
  boolean,
  typeof Scopes.Default
> {
  constructor() {
    super((input) => {
      if (typeof input === "boolean") return input;
      throw new MonarchParseError(
        `expected 'boolean' received '${typeof input}'`,
      );
    }, Scopes.Default);
  }
}
