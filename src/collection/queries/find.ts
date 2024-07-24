import { Sort as MongoSort } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaOutput } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";


export type Sort<T> = {
    [key in keyof T]?: SortDirection;
} | SortDirection | (keyof T extends string ? T : string)
    | [(T extends string ? T : string), SortDirection][] | [(T extends string ? T : string), SortDirection];

export type SortDirection = 1 | -1 | 'asc' | 'desc' | 'ascending' | 'descending';

export class FindQuery<T extends AnySchema> extends BaseFindQuery<T> {
    sort(sort: Sort<InferSchemaOutput<T>>): this {
        this._options.sort = sort as MongoSort
        return this;
    }

    // sort(sort: Sort): this {
    //     this._options.sort = sort;
    //     return this;
    // }


    limit(limit: number): this {
        this._options.limit = limit;
        return this;
    }

    skip(skip: number): this {
        this._options.skip = skip;
        return this;
    }

    async exec(): Promise<InferSchemaOutput<T>[]> {
        return this._collection
            .find(this.filters, {
                ...this._options,
                projection: this.projection,
            })
            .toArray()
            .then((res) => res.map((res) => this._schema.fromData(res)));
    }
}
