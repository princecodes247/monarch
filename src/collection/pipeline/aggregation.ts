import type { AggregateOptions, Collection as MongoCollection } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import { Pipeline } from "./base";

export class AggregationPipeline<
  T extends AnySchema,
  O extends any[],
> extends Pipeline<T, Promise<O>> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    protected _options: AggregateOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
  }

  public options(options: AggregateOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public castStage<O extends any[]>() {
    return this as unknown as AggregationPipeline<T, O>;
  }

  public cast<O extends any[]>() {
    return this as unknown as AggregationPipeline<T, O>;
  }

  public async exec(): Promise<O> {
    const res = await this._collection
      .aggregate(this._pipeline, this._options)
      .toArray();
    return res as O;
  }
}
