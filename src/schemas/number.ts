import { Schema, noopParser } from "./base";

export const number = () => new NumberSchema(noopParser());

class NumberSchema extends Schema<string> {}
