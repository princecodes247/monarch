import { BulkWriteOptions, OptionalUnlessRequiredId } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { BaseInsertManyQuery } from "./base";

export class InsertManyQuery<
    T extends AnySchema
> extends BaseInsertManyQuery<T> {
    protected _options: BulkWriteOptions = {}

    options(options: BulkWriteOptions): this {
        this._options = { ...this._options, ...options };
        return this;
    }

    async exec(): Promise<InferSchemaOutput<T>[]> {
        const result = await this._collection.insertMany(
            this.data as OptionalUnlessRequiredId<InferSchemaData<T>>[],
            this._options,
        );

        return this.data.map((data, index) =>
            this._schema.fromData({ _id: result.insertedIds[index], ...data })
        );
    }
}