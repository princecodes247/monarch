import type { Filter, Flatten } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { MongoDBCollection } from "../collection";
import { BaseFindQuery } from "./base";
import type { FilterQuery } from "./expressions";

export class DistinctQuery<
  T extends AnySchema,
  K extends keyof InferSchemaOutput<T>,
> extends BaseFindQuery<T> {
  constructor(
    _collection: MongoDBCollection<InferSchemaData<T>>,
    protected _schema: T,
    private _field: K,
    _filters?: FilterQuery<InferSchemaData<T>>,
  ) {
    super(_collection, _schema);
  }

  async exec(): Promise<Flatten<InferSchemaOutput<T>[K]>[]> {
    return this._collection.distinct(
      this._field,
      this.filters as unknown as Filter<InferSchemaData<T>>,
    ) as Promise<Flatten<InferSchemaOutput<T>[K]>>;
  }
}
