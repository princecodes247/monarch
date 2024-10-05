import type { DeleteOptions, DeleteResult, Filter } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";

export class DeleteManyQuery<T extends AnySchema> extends BaseFindQuery<T> {
  protected _options: DeleteOptions = {};

  options(options: DeleteOptions): this {
    this._options = { ...this._options, ...options };
    return this;
  }

  async exec(): Promise<DeleteResult> {
    const result = await this._collection.deleteMany(
      this.filters as unknown as Filter<InferSchemaData<T>>,
      this._options,
    );
    return result;
  }
}
