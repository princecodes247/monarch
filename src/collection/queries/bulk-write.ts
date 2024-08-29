import { AnyBulkWriteOperation, BulkWriteOptions } from "mongodb";
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
    protected _options: BulkWriteOptions = {}

    options(options: BulkWriteOptions): this {
        this._options = { ...this._options, ...options };
        return this;
    }

    values(data: AnyBulkWriteOperation<InferSchemaData<T>>[]): this {
        this.data = data;
        return this;
    }

    async exec(): Promise<BulkWriteResult<InferSchemaOutput<T>>> {
        return this._collection.bulkWrite(this.data,
            this._options,
        );
    }
}
