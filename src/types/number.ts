import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";

export const number = () => new MonarchNumber();

export class MonarchNumber extends MonarchType<number, number> {
  constructor() {
    super((input) => {
      if (typeof input === "number") return input;
      throw new MonarchParseError(
        `expected 'number' received '${typeof input}'`,
      );
    });
  }
}
