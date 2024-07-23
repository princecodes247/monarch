import { FindOneAndUpdateOptions } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaOutput } from "../../schema/type-helpers";
import { BaseMutationQuery } from "./base";


export class FindOneAndUpdateQuery<T extends AnySchema> extends BaseMutationQuery<T> {
    protected _options: FindOneAndUpdateOptions = {};

    options(options: FindOneAndUpdateOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    async exec(): Promise<InferSchemaOutput<T> | null> {
        return await this._collection
            .findOneAndUpdate(this.filters, this.data, this._options)
            .then((res) => (res ? this._schema.fromData(res) : res));
    }
}