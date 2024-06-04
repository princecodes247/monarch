import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";

export const number = () => {
  return new MonarchNumber((input) => {
    if (typeof input === "number") return input;
    throw new MonarchParseError(`expected 'number' received '${typeof input}'`);
  });
};

class MonarchNumber extends MonarchType<number> {}
