import type { BulkWriteOptions, OptionalUnlessRequiredId } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import { BaseInsertManyQuery } from "./base";

export class InsertManyQuery<
  T extends AnySchema,
> extends BaseInsertManyQuery<T> {
  protected _options: BulkWriteOptions = {};

  options(options: BulkWriteOptions): this {
    this._options = { ...this._options, ...options };
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T>[]> {
    const result = await this._collection.insertMany(
      this.data as OptionalUnlessRequiredId<InferSchemaData<T>>[],
    );

    return this.data.map((data, index) =>
      this._schema.fromData({ ...data, _id: result.insertedIds[index] }),
    );
  }
}
