import { MonarchParseError } from "../errors";
import { MonarchType, applyParser } from "./type";

export const date = () => new MonarchDate((input) => input);

class MonarchDate extends MonarchType<Date> {
  public after(date: Date) {
    return new MonarchDate(
      applyParser(this._parser, (input) => {
        if (input > date) return input;
        throw new MonarchParseError(`date must be after ${date}`);
      })
    );
  }
}

export const dateString = () => {
  return new MonarchDateString((input) => input.toISOString());
};

class MonarchDateString extends MonarchType<Date, string> {}
