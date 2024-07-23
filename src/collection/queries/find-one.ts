import { AnySchema } from "../../schema/schema";
import { InferSchemaOutput } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class FindOneQuery<T extends AnySchema> extends BaseFindQuery<T> {
    async exec(): Promise<InferSchemaOutput<T> | null> {
        return this._collection
            .findOne(this.filters, {
                projection: this.projection,
            })
            .then((res) => (res ? this._schema.fromData(res) : res));
    }
}

