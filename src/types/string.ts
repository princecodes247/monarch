import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";

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
    return string().extend(this, {
      postParse: (input) => input.toLowerCase(),
    });
  }

  public uppercase() {
    return string().extend(this, {
      postParse: (input) => input.toUpperCase(),
    });
  }
}
