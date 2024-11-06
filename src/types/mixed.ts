import { MonarchType } from "./type";

export const mixed = () => new MonarchMixed();

export class MonarchMixed extends MonarchType<unknown, unknown> {
  constructor() {
    super((input) => {
      return input;
    });
  }
}
