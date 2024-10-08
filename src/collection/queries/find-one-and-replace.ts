import { Filter, FindOneAndReplaceOptions } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
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
            .findOneAndReplace(this.filters as unknown as Filter<InferSchemaData<T>>, this.data, {
                ...this._options,
                projection: this.projection,
            })
            .then((res) => (res ? this._schema.fromData(res) : res));
    }
}

