import { MonarchType, applyParser } from "./type";

export const string = () => new MonarchString((input) => input);

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
