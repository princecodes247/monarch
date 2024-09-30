import { Filter } from "mongodb";
import { AnySchema } from "../../schema/schema";
import { InferSchemaData, InferSchemaOutput } from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";
import { PipelineStage } from "./pipeline/pipeline-stage";

export class FindOneQuery<T extends AnySchema> extends BaseFindQuery<T> {


    async exec() {
        if (this._population) {
            return this.execWithPopulate();
        } else {
            return this.execWithoutPopulate();
        }
    }

    async execWithoutPopulate(): Promise<InferSchemaOutput<T> | null> {
        return this._collection
            .findOne(this.filters as unknown as Filter<InferSchemaData<T>>, {
                ...this._options,
                projection: this.projection,
            })
            .then((res) => (res ? this._schema.fromData(res) : res));
    }

    private async execWithPopulate(): Promise<InferSchemaOutput<T> | null> {

        const pipeline: PipelineStage<InferSchemaOutput<T>>[] = [{ $match: this.filters }];
        for (const [key, value] of Object.entries(this._population ?? {})) {
            if (value) {
                const foreignCollectionName = this._schema.types[key].foreignSchema.name
                const foreignField = this._schema.types[key].field
                const foreignFieldVariable = `monarch_${foreignField}_variable`
                const foreignFieldData = `monarch_${key}_populated_data`
                console.log({ foreignCollectionName, foreignField })
                pipeline.push({
                    $lookup: {
                        from: `${foreignCollectionName}`,
                        let: { [foreignFieldVariable]: `$${key}` },
                        pipeline: [
                            { $match: { $expr: { $eq: [`$${foreignField}`, `$$${foreignFieldVariable}`] } } },
                        ],
                        as: foreignFieldData,
                    },
                });
                pipeline.push({ $unwind: `$${foreignFieldData}` }); // Unwind the populated field if it's an array
                pipeline.push({
                    $unset: key
                });
                pipeline.push({
                    $set: {
                        [key]: `$${foreignFieldData}`
                    }
                });
                pipeline.push({
                    $unset: foreignFieldData
                });
            }
        }

        const result = await this._collection.aggregate(pipeline).toArray();
        return result.length > 0 ? this._schema.fromData(result[0]) : null;
    }
}

