import { MonarchParseError } from "../errors";
import { MonarchDefaulted, MonarchType, applyParser } from "./type";

export const date = () => new MonarchDate();

export class MonarchDate extends MonarchType<Date, string> {
  constructor() {
    super((input) => {
      if (input instanceof Date) return input.toISOString();
      throw new MonarchParseError(`expected 'Date' received '${typeof input}'`);
    });
  }

  public after(date: Date) {
    const clone = new MonarchDate();
    clone._parser = applyParser((input) => {
      if (input > date) return input;
      throw new MonarchParseError(`date must be after ${date}`);
    }, this._parser);
    return clone;
  }
}

export const dateString = () => new MonarchDateString();

export class MonarchDateString extends MonarchType<Date, string> {
  constructor() {
    super((input) => {
      if (input instanceof Date) return input.toISOString();
      throw new MonarchParseError(`expected 'Date' received '${typeof input}'`);
    });
  }
}

export const createdAtDate = () => new MonarchCreatedAtDate();

export class MonarchCreatedAtDate extends MonarchDefaulted<MonarchDate> {
  constructor() {
    super(() => new Date(), new MonarchDate()._parser);
  }
}

export const updatedAtDate = () => new MonarchUpdatedAtDate();

export class MonarchUpdatedAtDate extends MonarchDefaulted<MonarchDate> {
  constructor() {
    super(() => new Date(), new MonarchDate()._parser);
    this._updateFn = () => this._parser(new Date());
  }
}
