import { MonarchParseError } from "../errors";
import { MonarchType, applyParser } from "./type";

export const string = () => new MonarchString();

export class MonarchString extends MonarchType<string, string> {
  constructor() {
    super((input) => {
      if (typeof input === "string") return input;
      throw new MonarchParseError(
        `expected 'string' received '${typeof input}'`,
      );
    });
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
