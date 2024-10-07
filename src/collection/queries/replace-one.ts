import type { Filter, ReplaceOptions } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { BaseMutationQuery } from "./base";

export class ReplaceOneQuery<T extends AnySchema> extends BaseMutationQuery<T> {
  protected _options: ReplaceOptions = {};

  options(options: ReplaceOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<boolean> {
    const result = await this._collection.replaceOne(
      this.filters as unknown as Filter<InferSchemaData<T>>,
      this.data,
      this._options,
    );
    return !!result.modifiedCount;
  }
}
