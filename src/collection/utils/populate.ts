import type { Sort as MongoSort } from "mongodb";
import {
  type AnyMonarchRelation,
  MonarchRelation,
} from "../../schema/relations/base";
import { MonarchMany } from "../../schema/relations/many";
import { MonarchOne } from "../../schema/relations/one";
import { MonarchRef } from "../../schema/relations/ref";
import type { PipelineStage } from "../types/pipeline-stage";

export function generatePopulatePipeline(
  relationField: string,
  relation: AnyMonarchRelation,
): PipelineStage<any>[] {
  const pipeline: PipelineStage<any>[] = [];
  const type = MonarchRelation.getRelation(relation);

  if (type instanceof MonarchMany) {
    const collectionName = type._target.name;
    const foreignField = type._field;
    pipeline.push({
      $lookup: {
        from: collectionName,
        localField: relationField,
        foreignField: foreignField,
        as: relationField,
      },
    });
  }

  if (type instanceof MonarchRef) {
    const collectionName = type._target.name;
    const foreignField = type._field;
    const sourceField = type._references;
    const fieldVariable = `monarch_${relationField}_${foreignField}_var`;
    const fieldData = `monarch_${relationField}_data`;
    pipeline.push({
      $lookup: {
        from: collectionName,
        let: {
          [fieldVariable]: `$${sourceField}`,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [`$${foreignField}`, `$$${fieldVariable}`],
              },
            },
          },
        ],
        as: fieldData,
      },
    });
    // Replace the original field with the populated data
    pipeline.push(
      { $unset: relationField },
      { $set: { [relationField]: `$${fieldData}` } }, // Set the populated data
      { $unset: fieldData }, // Clean up the temp fieldData
    );
  }

  if (type instanceof MonarchOne) {
    const collectionName = type._target.name;
    const foreignField = type._field;
    const fieldVariable = `monarch_${relationField}_${foreignField}_var`;
    const fieldData = `monarch_${relationField}_data`;
    pipeline.push({
      $lookup: {
        from: collectionName,
        let: {
          [fieldVariable]: `$${relationField}`,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [`$${foreignField}`, `$$${fieldVariable}`],
              },
            },
          },
        ],
        as: fieldData,
      },
    });
    // Unwind the populated field if it's a single relation
    pipeline.push({
      $set: {
        [fieldData]: {
          $cond: {
            if: { $gt: [{ $size: `$${fieldData}` }, 0] }, // Skip population if value is null
            // biome-ignore lint/suspicious/noThenProperty: this is MongoDB syntax
            then: { $arrayElemAt: [`$${fieldData}`, 0] }, // Unwind the first populated result
            else: null, // Keep the original value
          },
        },
      },
    });
    // Replace the original field with the populated data
    pipeline.push(
      { $unset: relationField },
      { $set: { [relationField]: `$${fieldData}` } }, // Set the populated data
      { $unset: fieldData }, // Clean up the temp fieldData
    );
  }

  return pipeline;
}

export const generatePopulationMetas = ({
  sort,
  skip,
  limit,
}: {
  sort?: Record<string, 1 | Meta | -1>;
  skip?: number;
  limit?: number;
}) => {
  const metas: PipelineStage<any>[] = [];
  if (sort) {
    metas.push({ $sort: sort });
  }
  if (skip) {
    metas.push({ $skip: skip });
  }
  if (limit) {
    metas.push({ $limit: limit });
  }
  return metas;
};

type Meta = { $meta: any };

export const getSortDirection = (
  order?: MongoSort,
): Record<string, 1 | -1 | Meta> => {
  // Handle Record<string, SortDirection>
  if (typeof order === "object" && order !== null) {
    const sortDirections: Record<string, 1 | -1 | Meta> = {};

    for (const key in order) {
      const value = order[key as keyof typeof order];

      if (value === "asc" || value === "ascending" || value === 1) {
        sortDirections[key] = 1;
      } else if (value === "desc" || value === "descending" || value === -1) {
        sortDirections[key] = -1;
      } else {
        sortDirections[key] = value as Meta;
      }
    }
    return sortDirections;
  }

  return {};
};
