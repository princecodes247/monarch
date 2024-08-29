import { CountDocumentsOptions, Filter } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class CountQuery<T extends AnySchema> extends BaseFindQuery<T> {
    protected _options: CountDocumentsOptions = {}

    options(options: CountDocumentsOptions): this {
        this._options = { ...this._options, ...options };
        return this;
    }

    async exec(): Promise<number> {
        return this._collection.countDocuments(this.filters as unknown as Filter<InferSchemaData<T>>, this._options);
    }
}
