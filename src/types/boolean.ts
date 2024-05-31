import { MonarchType } from "./type";

export const boolean = () => new MonarchBoolean((input) => input);

class MonarchBoolean extends MonarchType<boolean> {}
