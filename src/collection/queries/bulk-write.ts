import { AnyBulkWriteOperation } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { Query } from "./base";


type BulkWriteResult<T> = {
    insertedCount: number;
    matchedCount: number;
    modifiedCount: number;
    deletedCount: number;
    upsertedCount: number;
    insertedIds: { [key: number]: T };
    upsertedIds: { [key: number]: T };
};

export class BulkWriteQuery<T extends AnySchema> extends Query<T> {
    protected data = [] as AnyBulkWriteOperation<InferSchemaData<T>>[];

    values(data: AnyBulkWriteOperation<InferSchemaData<T>>[]): this {
        this.data = data;
        return this;
    }

    async exec(): Promise<BulkWriteResult<InferSchemaOutput<T>>> {
        return this._collection.bulkWrite(this.data);
    }
}
