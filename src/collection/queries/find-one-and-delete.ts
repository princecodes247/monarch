import type { Filter, FindOneAndDeleteOptions } from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class FindOneAndDeleteQuery<
  T extends AnySchema,
> extends BaseFindQuery<T> {
  protected _options: FindOneAndDeleteOptions = {};

  options(options: FindOneAndDeleteOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T> | null> {
    return this._collection
      .findOneAndDelete(this.filters as unknown as Filter<InferSchemaData<T>>, {
        ...this._options,
        projection: this.projection,
      })
      .then((res) => (res ? Schema.fromData(this._schema, res) : res));
  }
}
