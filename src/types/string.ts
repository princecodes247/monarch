import { MonarchParseError } from "../errors";
import { MonarchType, applyParser } from "./type";

export const string = () => {
  return new MonarchString((input) => {
    if (typeof input === "string") return input;
    throw new MonarchParseError(`expected 'string' received '${typeof input}'`);
  });
};

class MonarchString extends MonarchType<string> {
  public lowercase() {
    return new MonarchString(
      applyParser(this._parser, (input) => input.toLowerCase())
    );
  }

  public uppercase() {
    return new MonarchString(
      applyParser(this._parser, (input) => input.toUpperCase())
    );
  }
}
