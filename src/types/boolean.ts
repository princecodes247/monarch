import { MonarchType, noopParser } from "./type";

export const boolean = () => new MonarchBoolean(noopParser());

class MonarchBoolean extends MonarchType<boolean> {}
