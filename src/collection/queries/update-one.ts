import type { Filter, UpdateOptions, UpdateResult } from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { BaseUpdateQuery } from "./base";

export class UpdateOneQuery<T extends AnySchema> extends BaseUpdateQuery<T> {
  protected _options: UpdateOptions = {};

  options(options: UpdateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec() {
    const fieldUpdates = Schema.getFieldUpdates(this._schema);
    const data = this.data;
    // @ts-ignore
    data.$set = { ...fieldUpdates, ...data.$set };
    const result: UpdateResult = await this._collection.updateOne(
      this.filters as unknown as Filter<InferSchemaData<T>>,
      data,
      this._options,
    );
    return result;
  }
}
