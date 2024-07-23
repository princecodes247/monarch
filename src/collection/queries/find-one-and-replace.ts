import { FindOneAndReplaceOptions } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaOutput } from "../../schema/type-helpers";
import { BaseMutationQuery } from "./base";

export class FindOneAndReplaceQuery<
    T extends AnySchema
> extends BaseMutationQuery<T> {
    protected _options: FindOneAndReplaceOptions = {};

    options(options: FindOneAndReplaceOptions): this {
        this._options = { ...this._options, ...options };
        return this;
    }

    async exec(): Promise<InferSchemaOutput<T> | null> {
        return this._collection
            .findOneAndReplace(this.filters, this.data, this._options)
            .then((res) => (res ? this._schema.fromData(res) : res));
    }
}

