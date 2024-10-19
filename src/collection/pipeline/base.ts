import type { Collection as MongoCollection } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";
import type { PipelineStage } from "../types/pipeline-stage";

export abstract class Pipeline<T extends AnySchema, O> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    protected _pipeline: PipelineStage<InferSchemaData<T>>[] = [],
  ) {}

  public addStage(stage: PipelineStage<InferSchemaData<T>>): this {
    this._pipeline.push(stage);
    return this;
  }

  public abstract exec(): O;
}
