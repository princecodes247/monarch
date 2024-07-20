import type {
    Filter,
    Collection as MongoDBCollection
} from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class DistinctQuery<T extends AnySchema> extends BaseFindQuery<T> {

    constructor(
        _collection: MongoDBCollection<InferSchemaData<T>>,
        protected _schema: T,
        private _field: keyof InferSchemaData<T>,
        _filters?: Filter<InferSchemaData<T>>,
    ) {
        super(_collection, _schema);
    }

    async exec(): Promise<any[]> {

        return this._collection.distinct(this._field, this.filters);
    }
}



