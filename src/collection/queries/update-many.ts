import { Filter, UpdateOptions, UpdateResult } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData } from "../../schema/type-helpers";
import { BaseUpdateQuery } from "./base";

export class UpdateManyQuery<T extends AnySchema> extends BaseUpdateQuery<T> {
    protected _options: UpdateOptions = {};

    options(options: UpdateOptions): this {
        this._options = { ...this._options, ...options };
        return this;
    }

    async exec() {
        const result: UpdateResult = await this._collection.updateMany(
            this.filters as unknown as Filter<InferSchemaData<T>>,
            this.data,
            this._options
        );
        return result;
    }
}