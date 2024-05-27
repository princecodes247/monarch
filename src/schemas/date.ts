import { Schema, noopParser } from "./base";

export const date = () => new DateSchema(noopParser());

class DateSchema extends Schema<Date> {}

export const dateString = () => {
  return new DateStringSchema({
    validate: (input) => input,
    transform: (input) => input.toISOString(),
  });
};

class DateStringSchema extends Schema<Date, string> {
  after(date: Date) {
    return new DateStringSchema({
      validate: (input) => {
        const val = this._parser.validate(input);
        if (val < date) throw new Error(`date must be after ${date}`);
        return val;
      },
      transform: (input) => {
        return this._parser.transform(input);
      },
    });
  }
}
