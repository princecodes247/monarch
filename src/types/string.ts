import { MonarchParseError } from "../errors";
import { MonarchType, Scopes, applyParser } from "./type";

export const string = () => new MonarchString();

export class MonarchString extends MonarchType<
  string,
  string,
  typeof Scopes.Default
> {
  constructor() {
    super((input) => {
      if (typeof input === "string") return input;
      throw new MonarchParseError(
        `expected 'string' received '${typeof input}'`,
      );
    }, Scopes.Default);
  }

  public lowercase() {
    const clone = new MonarchString();
    clone._parser = applyParser(this._parser, (input) => input.toLowerCase());
    return clone;
  }

  public uppercase() {
    const clone = new MonarchString();
    clone._parser = applyParser(this._parser, (input) => input.toUpperCase());
    return clone;
  }
}
