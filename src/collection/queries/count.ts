import { AnySchema } from "../../schema/schema";
import { BaseFindQuery } from "./base";

export class CountQuery<T extends AnySchema> extends BaseFindQuery<T> {
    async exec(): Promise<number> {
        return this._collection.countDocuments(this.filters);
    }
}
