import { Filter, FindOneAndUpdateOptions } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { BaseMutationQuery } from "./base";

export class FindOneAndUpdateQuery<
  T extends AnySchema
> extends BaseMutationQuery<T> {
  protected _options: FindOneAndUpdateOptions = {};

  options(options: FindOneAndUpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T> | null> {
    const fieldUpdates = this._schema.fieldUpdates();
    const data = this.data;
    // @ts-ignore
    data["$set"] = { ...fieldUpdates, ...data["$set"] };
    return await this._collection
      .findOneAndUpdate(
        this.filters as unknown as Filter<InferSchemaData<T>>,
        data,
        this._options
      )
      .then((res) => (res ? this._schema.fromData(res) : res));
  }
}
