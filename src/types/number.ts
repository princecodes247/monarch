import { MonarchType, noopParser } from "./type";

export const number = () => new MonarchNumber(noopParser());

class MonarchNumber extends MonarchType<number> {}
