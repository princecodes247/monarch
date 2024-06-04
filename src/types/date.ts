import { MonarchParseError } from "../errors";
import { MonarchType, applyParser } from "./type";

export const date = () => {
  return new MonarchDate((input) => {
    if (input instanceof Date) return input;
    throw new MonarchParseError(`expected 'Date' received '${typeof input}'`);
  });
};

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
  return new MonarchDateString((input) => {
    if (input instanceof Date) return input.toISOString();
    throw new MonarchParseError(`expected 'Date' received '${typeof input}'`);
  });
};

class MonarchDateString extends MonarchType<Date, string> {}
