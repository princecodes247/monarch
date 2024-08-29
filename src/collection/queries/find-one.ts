import { Filter } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class FindOneQuery<T extends AnySchema> extends BaseFindQuery<T> {

    async exec(): Promise<InferSchemaOutput<T> | null> {
        return this._collection
            .findOne(this.filters as unknown as Filter<InferSchemaData<T>>, {
                ...this._options,
                projection: this.projection,
            })
            .then((res) => (res ? this._schema.fromData(res) : res));
    }
}

