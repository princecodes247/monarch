import type { Sort as MongoSort } from "mongodb";
import { MonarchRelation } from "../../schema/relations/base";
import { MonarchMany } from "../../schema/relations/many";
import { MonarchOne } from "../../schema/relations/one";
import { MonarchRef } from "../../schema/relations/ref";
import type { PipelineStage } from "../types/pipeline-stage";

export const generatePopulatePipeline = (
  relation: any,
  relationKey: string,
): PipelineStage<any>[] => {
  const relationDetails = MonarchRelation.getRelation(relation);
  if (!relationDetails) return [];

  const type = inferRelationType(relationDetails);
  if (!type) return [];

  const collectionName = relationDetails._target.name;
  if (!collectionName) return [];

  const foreignField = relationDetails._field;
  const fieldVariable = `monarch_${relationKey}_${foreignField}_var`;
  const fieldData = `monarch_${relationKey}_data`;
  const target = relationDetails._references;
  const pipeline: PipelineStage<any>[] = [];

  if (type === "many") {
    // Lookup for "many" relations
    pipeline.push({
      $lookup: {
        from: collectionName,
        localField: relationKey,
        foreignField: "_id",
        as: relationKey,
      },
    });
  } else {
    // Lookup for "single" and "ref" relations
    pipeline.push({
      $lookup: {
        from: collectionName,
        let: { [fieldVariable]: `$${type === "ref" ? target : relationKey}` },
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
    if (type === "one") {
      pipeline.push({ $unwind: `$${fieldData}` });
    }

    // Replace the original field with the populated data
    pipeline.push(
      { $unset: relationKey },
      { $set: { [relationKey]: `$${fieldData}` } }, // Set the populated data
      { $unset: fieldData }, // Clean up the temp fieldData
    );
  }

  return pipeline;
};

export const inferRelationType = (
  relation: any,
): "many" | "ref" | "one" | null => {
  if (relation instanceof MonarchOne) return "one";
  if (relation instanceof MonarchRef) return "ref";
  if (relation instanceof MonarchMany) return "many";
  return null;
};

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
