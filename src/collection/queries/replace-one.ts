import { ReplaceOptions } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { BaseMutationQuery } from "./base";

export class ReplaceOneQuery<T extends AnySchema> extends BaseMutationQuery<T> {
    protected _options: ReplaceOptions = {};

    options(options: ReplaceOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    async exec(): Promise<boolean> {
        const result = await this._collection.replaceOne(
            this.filters,
            this.data,
            this._options
        );
        return !!result.modifiedCount;
    }
}