import type {
    Filter,
    FindOptions,
    Collection as MongoDBCollection,
    OptionalUnlessRequiredId,
    WithId
} from "mongodb";
import { AnySchema } from "../../schema/schema";
import {
    InferSchemaData,
    InferSchemaInput,
} from "../../schema/type-helpers";

export type Projection<T> = {
    [K in keyof T]?: 1 | 0;
};
export type UpdateFilter<T> = {
    $currentDate?: { [K in keyof T]?: true | { $type: "date" | "timestamp" } };
    $inc?: { [K in keyof T]?: number };
    $min?: { [K in keyof T]?: T[K] };
    $max?: { [K in keyof T]?: T[K] };
    $mul?: { [K in keyof T]?: number };
    $rename?: { [K in keyof T]?: string };
    $set?: Partial<T>;
    $setOnInsert?: Partial<T>;
    $unset?: { [K in keyof T]?: "" | 1 | true };
    $addToSet?: { [K in keyof T]?: T[K] | { $each: T[K][] } };
    $pop?: { [K in keyof T]?: -1 | 1 };
    $pull?: { [K in keyof T]?: T[K] | { [key: string]: any } };
    $push?: {
        [K in keyof T]?:
        | T[K]
        | {
            $each: T[K][];
            $position?: number;
            $slice?: number;
            $sort?: 1 | -1 | { [key: string]: 1 | -1 };
        };
    };
    $pullAll?: { [K in keyof T]?: T[K][] };
} & {
        // [K in keyof T]?: T[K] | { $each: T[K][] } | { $position?: number; $slice?: number; $sort?: 1 | -1 | { [key: string]: 1 | -1 } } | { $each: T[K][] } | UpdateFilter<T>;
        [K in keyof T]?: T[K] | UpdateFilter<T[K]>;
    };


// Define a base query class
export class Query<T extends AnySchema> {
    protected filters: Filter<InferSchemaData<T>> = {};
    protected projection: Projection<WithId<InferSchemaData<T>>> = {};
    protected _options: FindOptions = {};

    constructor(
        protected readonly _collection: MongoDBCollection<InferSchemaData<T>>,
        protected _schema: T
    ) { }


    select(...fields: (keyof WithId<InferSchemaData<T>>)[]): this {
        this.projection = fields.reduce((acc, field) => {
            acc[field] = 1;
            return acc;
        }, {} as Projection<WithId<InferSchemaData<T>>>);
        return this;
    }

    omit(...fields: (keyof WithId<InferSchemaData<T>>)[]): this {
        this.projection = fields.reduce((acc, field) => {
            acc[field] = 0;
            return acc;
        }, {} as Projection<WithId<InferSchemaData<T>>>);
        return this;
    }

    options(options: FindOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    async exec(): Promise<any> {
        throw new Error("exec() method must be implemented in subclasses");
    }
}


export class BaseFindQuery<T extends AnySchema> extends Query<T> {
    constructor(
        _collection: MongoDBCollection<InferSchemaData<T>>,
        protected _schema: T,
        _filters?: Filter<InferSchemaData<T>>,
    ) {
        super(_collection, _schema);
        Object.assign(this.filters, _filters);
    }

    where(filter: Filter<InferSchemaData<T>>): this {
        Object.assign(this.filters, filter);
        return this;
    }

}

export class BaseMutationQuery<T extends AnySchema> extends BaseFindQuery<T> {
    protected data = {} as OptionalUnlessRequiredId<InferSchemaData<T>>;

    constructor(
        _collection: MongoDBCollection<InferSchemaData<T>>,
        protected _schema: T,
        _filters?: Filter<InferSchemaData<T>>,
    ) {
        super(_collection, _schema, _filters);
    }

    values(data: UpdateFilter<InferSchemaData<T>>): this {
        Object.assign(this.data, data);
        // this.data = parseSchema(this._schema, data) as OptionalUnlessRequiredId<InferSchemaData<T>>;
        return this;
    }
}

export class BaseUpdateQuery<T extends AnySchema> extends BaseMutationQuery<T> {
    protected data = {} as OptionalUnlessRequiredId<InferSchemaData<T>>;

    values(values: UpdateFilter<InferSchemaData<T>>): this {
        Object.assign(this.data, values);
        return this;
    }
    set(values: UpdateFilter<InferSchemaData<T>>): this {
        Object.assign(this.data, { $set: values });
        return this;
    }
}

export class BaseInsertQuery<T extends AnySchema> extends Query<T> {
    protected data = {} as InferSchemaData<T>;

    values(data: InferSchemaInput<T>): this {
        this.data = this._schema.toData(data);
        return this;
    }
}

export class BaseInsertManyQuery<T extends AnySchema> extends Query<T> {
    protected data = [] as InferSchemaData<T>[];

    values(data: InferSchemaInput<T>[]): this {
        this.data = data.map((value) => this._schema.toData(value));
        return this;
    }
}
