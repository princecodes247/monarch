import { OptionalUnlessRequiredId } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { BaseInsertQuery } from "./base";

export class InsertOneQuery<T extends AnySchema> extends BaseInsertQuery<T> {
    async exec(): Promise<InferSchemaOutput<T>> {
        const result = await this._collection.insertOne(
            this.data as OptionalUnlessRequiredId<InferSchemaData<T>>
        );
        return this._schema.fromData({ _id: result.insertedId, ...this.data });
    }
}