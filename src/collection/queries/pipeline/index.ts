import type {
    AggregateOptions,
    ChangeStreamOptions,
    OptionalUnlessRequiredId,
} from "mongodb";
import { AnySchema } from "../../../schema/schema";
import {
    InferSchemaData
} from "../../../schema/type-helpers";
import { MongoDBCollection } from "../../collection";
import { PipelineStage } from "./pipeline-stage";


export class Pipeline<T extends AnySchema> {
    protected pipeline: PipelineStage<
        OptionalUnlessRequiredId<InferSchemaData<T>>
    >[] = [];
    protected _options: AggregateOptions = {};

    constructor(protected readonly _collection: MongoDBCollection<InferSchemaData<T>>,
        pipeline?: PipelineStage<OptionalUnlessRequiredId<InferSchemaData<T>>>[]) {
        if (pipeline) {
            this.pipeline = pipeline;
        }
    }


    options(options: AggregateOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    // Method to add a stage to the pipeline
    addStage(
        stage: PipelineStage<OptionalUnlessRequiredId<InferSchemaData<T>>>
    ): this {
        this.pipeline.push(stage);
        return this;
    }

}

export class AggregationPipeline<T extends AnySchema> extends Pipeline<T> {

    options(options: AggregateOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    // Method to execute the aggregation pipeline
    async exec() {
        const aggregatedData = this._collection.aggregate(this.pipeline, this._options);
        return await aggregatedData.toArray()
    }
}

export class WatchPipeline<T extends AnySchema> extends Pipeline<T> {
    protected _options: ChangeStreamOptions = {};

    options(options: ChangeStreamOptions): this {
        Object.assign(this._options, options);
        return this;
    }

    addStage(
        stage: PipelineStage<any>
    ): this {
        this.pipeline.push(stage);
        return this;
    }

    // Method to execute the watch pipeline
    exec() {
        return this._collection.watch(this.pipeline, this._options);
    }
}
