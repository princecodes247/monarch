import { Schema, noopParser } from "./base";

export const string = () => new StringSchema(noopParser());

class StringSchema extends Schema<string> {}
