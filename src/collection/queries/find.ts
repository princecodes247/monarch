import { AnySchema } from "../../schema/schema";
import { InferSchemaData } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class FindQuery<T extends AnySchema> extends BaseFindQuery<T> {
    limit(limit: number): this {
        this._options.limit = limit;
        return this;
    }

    skip(skip: number): this {
        this._options.skip = skip;
        return this;
    }

    async exec(): Promise<InferSchemaData<T>[]> {
        return this._collection
            .find(this.filters, {
                ...this._options,
                projection: this.projection,
            })
            .toArray()
            .then((res) => res.map((res) => this._schema.fromData(res)));
    }
}
