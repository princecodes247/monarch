import { MonarchType, noopParser } from "./type";

export const string = () => new MonarchString(noopParser());

class MonarchString extends MonarchType<string> {
  public lowercase() {
    return new MonarchString({
      validate: this._parser.validate,
      transform: (input) => input.toLowerCase(),
    });
  }

  public uppercase() {
    return new MonarchString({
      validate: this._parser.validate,
      transform: (input) => input.toUpperCase(),
    });
  }
}
