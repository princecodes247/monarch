import { MonarchType, noopParser } from "./type";

export const date = () => new MonarchDate(noopParser());

class MonarchDate extends MonarchType<Date> {}

export const dateString = () => {
  return new MonarchDateString({
    validate: (input) => input,
    transform: (input) => input.toISOString(),
  });
};

class MonarchDateString extends MonarchType<Date, string> {
  public after(date: Date) {
    return new MonarchDateString({
      validate: (input) => {
        const val = this._parser.validate(input);
        if (val < date) throw new Error(`date must be after ${date}`);
        return val;
      },
      transform: this._parser.transform,
    });
  }
}
