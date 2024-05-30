import { MonarchType, noopParser } from "./type";

export const string = () => new MonarchString(noopParser());

class MonarchString extends MonarchType<string> {
  public lowercase() {
    return new MonarchString({
      validate: this._parser.validate,
      transform: (input) => {
        const val = this._parser.validate(input);
        return val.toLowerCase();
      },
    });
  }

  public uppercase() {
    return new MonarchString({
      validate: this._parser.validate,
      transform: (input) => {
        const val = this._parser.validate(input);
        return val.toUpperCase();
      },
    });
  }
}
