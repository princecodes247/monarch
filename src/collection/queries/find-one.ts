import type { Filter } from "mongodb";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import { BaseFindQuery } from "./base";
import type { PipelineStage } from "./pipeline/pipeline-stage";

export class FindOneQuery<T extends AnySchema> extends BaseFindQuery<T> {
  async exec(): Promise<InferSchemaOutput<T> | null> {
    if (this.populations) return this.execWithPopulate();
    return this.execWithoutPopulate();
  }

  private async execWithoutPopulate(): Promise<InferSchemaOutput<T> | null> {
    return this._collection
      .findOne(this.filters as unknown as Filter<InferSchemaData<T>>, {
        ...this._options,
        projection: this.projection,
      })
      .then((res) => (res ? Schema.fromData(this._schema, res) : res));
  }

  private async execWithPopulate(): Promise<InferSchemaOutput<T> | null> {
    const pipeline: PipelineStage<InferSchemaOutput<T>>[] = [
      // @ts-expect-error
      { $match: this.filters },
    ];
    for (const [key, value] of Object.entries(this.populations)) {
      if (!value) continue;
      const population = this._schema.relations[key];
      const foreignCollectionName = population.target.name;
      const foreignField = population.options.field;
      const foreignFieldVariable = `monarch_${foreignField}_variable`;
      const foreignFieldData = `monarch_${key}_populated_data`;
      pipeline.push({
        $lookup: {
          from: `${foreignCollectionName}`,
          let: { [foreignFieldVariable]: `$${key}` },
          pipeline: [
            {
              $match: {
                // @ts-expect-error
                $expr: {
                  $eq: [`$${foreignField}`, `$$${foreignFieldVariable}`],
                },
              },
            },
          ],
          as: foreignFieldData,
        },
      });
      pipeline.push({ $unwind: `$${foreignFieldData}` }); // Unwind the populated field if it's an array
      pipeline.push({
        $unset: key,
      });
      pipeline.push({
        $set: {
          [key]: `$${foreignFieldData}`,
        },
      });
      pipeline.push({
        $unset: foreignFieldData,
      });
    }
    const result = await this._collection.aggregate(pipeline).toArray();
    return result.length > 0
      ? Schema.fromData(this._schema, result[0] as any)
      : null;
  }
}
