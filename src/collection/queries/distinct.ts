import type {
    Filter,
    Flatten,
    Collection as MongoDBCollection
} from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class DistinctQuery<T extends AnySchema, K extends keyof InferSchemaOutput<T>> extends BaseFindQuery<T> {

    constructor(
        _collection: MongoDBCollection<InferSchemaData<T>>,
        protected _schema: T,
        private _field: K,
        _filters?: Filter<InferSchemaData<T>>,
    ) {
        super(_collection, _schema);
    }



    async exec(): Promise<Flatten<InferSchemaOutput<T>[K]>[]> {
        return this._collection.distinct(this._field, this.filters);
    }
}



