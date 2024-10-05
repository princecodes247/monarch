import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";

export const boolean = () => {
  return new MonarchBoolean((input) => {
    if (typeof input === "boolean") return input;
    throw new MonarchParseError(
      `expected 'boolean' received '${typeof input}'`,
    );
  });
};

class MonarchBoolean extends MonarchType<boolean> {}
