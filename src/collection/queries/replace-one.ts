import { Filter, ReplaceOptions } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData } from "../../schema/type-helpers";
import { BaseMutationQuery } from "./base";

export class ReplaceOneQuery<T extends AnySchema> extends BaseMutationQuery<T> {
    protected _options: ReplaceOptions = {};

    options(options: ReplaceOptions): this {
        this._options = { ...this._options, ...options };

        return this;
    }

    async exec(): Promise<boolean> {
        const result = await this._collection.replaceOne(
            this.filters as unknown as Filter<InferSchemaData<T>>,
            this.data,
            this._options
        );
        return !!result.modifiedCount;
    }
}