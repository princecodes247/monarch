import type {
    Filter,
    Flatten
} from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { MongoDBCollection } from "../collection";
import { BaseFindQuery } from "./base";
import { FilterQuery } from "./expressions";

export class DistinctQuery<T extends AnySchema, K extends keyof InferSchemaOutput<T>> extends BaseFindQuery<T> {

    constructor(
        _collection: MongoDBCollection<InferSchemaData<T>>,
        protected _schema: T,
        private _field: K,
        _filters?: FilterQuery<InferSchemaData<T>>,
    ) {
        super(_collection, _schema);
    }



    async exec(): Promise<Flatten<InferSchemaOutput<T>[K]>[]> {
        return this._collection.distinct(this._field, this.filters as unknown as Filter<InferSchemaData<T>>);
    }
}



