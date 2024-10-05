import type { InsertOneOptions, OptionalUnlessRequiredId } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import { BaseInsertQuery } from "./base";

export class InsertOneQuery<T extends AnySchema> extends BaseInsertQuery<T> {
  protected _options: InsertOneOptions = {};

  options(options: InsertOneOptions): this {
    this._options = { ...this._options, ...options };
    return this;
  }

  async exec(): Promise<InferSchemaOutput<T>> {
    const result = await this._collection.insertOne(
      this.data as OptionalUnlessRequiredId<InferSchemaData<T>>,
    );
    return this._schema.fromData({ ...this.data, _id: result.insertedId });
  }
}
