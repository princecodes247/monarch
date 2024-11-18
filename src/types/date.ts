import { MonarchParseError } from "../errors";
import { MonarchType } from "./type";

export const date = () => new MonarchDate();

export class MonarchDate extends MonarchType<Date, string> {
  constructor() {
    super((input) => {
      if (input instanceof Date) return input.toISOString();
      throw new MonarchParseError(`expected 'Date' received '${typeof input}'`);
    });
  }

  public after(afterDate: Date) {
    return date().extend(this, {
      preParse: (input) => {
        if (input > afterDate) return input;
        throw new MonarchParseError(`date must be after ${afterDate}`);
      },
    });
  }
}

export const createdAt = () => date().default(() => new Date());

export const updatedAt = () => {
  const base = date();
  return base
    .extend(base, { onUpdate: () => new Date() })
    .default(() => new Date());
};
