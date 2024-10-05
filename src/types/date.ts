import { MonarchParseError } from "../errors";
import { MonarchDefaulted, MonarchType, applyParser } from "./type";

export const date = () => {
  return new MonarchDate((input) => {
    if (input instanceof Date) return input.toISOString();
    throw new MonarchParseError(`expected 'Date' received '${typeof input}'`);
  });
};

class MonarchDate extends MonarchType<Date, string> {
  public after(date: Date) {
    return new MonarchDate(
      applyParser((input) => {
        if (input > date) return input;
        throw new MonarchParseError(`date must be after ${date}`);
      }, this._parser),
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

export const createdAtDate = () => {
  return new MonarchCreatedAtDate(date()._parser, () => new Date());
};

class MonarchCreatedAtDate extends MonarchDefaulted<MonarchDate> {}

export const updatedAtDate = () => {
  const type = new MonarchUpdatedAtDate(date()._parser, () => new Date());
  type._updateFn = () => new Date().toISOString();
  return type;
};

class MonarchUpdatedAtDate extends MonarchDefaulted<MonarchDate> {}
