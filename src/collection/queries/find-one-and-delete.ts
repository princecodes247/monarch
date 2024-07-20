import type {
    FindOneAndDeleteOptions
} from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class FindOneAndDeleteQuery<T extends AnySchema> extends BaseFindQuery<T> {
    protected _options: FindOneAndDeleteOptions = {};

    options(options: FindOneAndDeleteOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    async exec(): Promise<InferSchemaData<T> | null> {
        return this._collection
            .findOneAndDelete(this.filters, this._options)
            .then((res) => (res ? this._schema.fromData(res) : res));
    }
}