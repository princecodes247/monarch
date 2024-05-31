import { MonarchType } from "./type";

export const number = () => new MonarchNumber((input) => input);

export class MonarchNumber extends MonarchType<number> {}
