import type { Sort as MongoSort } from "mongodb";
import { MonarchMany } from "../../schema/relations/many";
import { MonarchOne } from "../../schema/relations/one";
import { MonarchRef } from "../../schema/relations/ref";
import type {
  RelationPopulationOptions,
  RelationType,
} from "../../schema/relations/type-helpers";
import type { Meta } from "../types/expressions";
import type {
  Limit,
  Lookup,
  PipelineStage,
  Skip,
  Sort,
} from "../types/pipeline-stage";
import type { Projection } from "../types/query-options";

/**
 * Adds population stages to an existing MongoDB pipeline for relation handling
 * @param pipeline - The MongoDB pipeline array to modify
 * @param relationField - The field name containing the relation
 * @param relation - The Monarch relation configuration
 * @param projection - The population projection with schema fallback
 * @param options - The population options
 */
export function addPopulationPipeline(
  pipeline: PipelineStage<any>[],
  relationField: string,
  relation: RelationType,
  projection: Projection<any>,
  options: RelationPopulationOptions<any>,
) {
  if (relation instanceof MonarchMany) {
    const collectionName = relation._target.name;
    const foreignField = relation._field;
    pipeline.push({
      $lookup: {
        from: collectionName,
        localField: relationField,
        foreignField: foreignField,
        as: relationField,
        pipeline: buildPipelineOptions(projection, options),
      },
    });
    pipeline.push({
      $addFields: {
        [relationField]: {
          $cond: {
            if: { $isArray: `$${relationField}` },
            // biome-ignore lint/suspicious/noThenProperty: this is MongoDB syntax
            then: `$${relationField}`,
            else: [],
          },
        },
      },
    });
  }

  if (relation instanceof MonarchRef) {
    const collectionName = relation._target.name;
    const foreignField = relation._field;
    const sourceField = relation._references;
    const fieldVariable = `monarch_${relationField}_${foreignField}_var`;
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
                $and: [
                  { $ne: [`$$${fieldVariable}`, null] },
                  { $eq: [`$${foreignField}`, `$$${fieldVariable}`] },
                ],
              },
            },
          },
          ...buildPipelineOptions(projection, options),
        ],
        as: relationField,
      },
    });
  }

  if (relation instanceof MonarchOne) {
    const collectionName = relation._target.name;
    const foreignField = relation._field;
    const fieldVariable = `monarch_${relationField}_${foreignField}_var`;
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
          ...buildPipelineOptions(projection, { limit: 1 }),
        ],
        as: relationField,
      },
    });
    // Unwind the populated field if it's a single relation
    pipeline.push({
      $set: {
        [relationField]: {
          $cond: {
            if: { $gt: [{ $size: `$${relationField}` }, 0] }, // Skip population if value is null
            // biome-ignore lint/suspicious/noThenProperty: this is MongoDB syntax
            then: { $arrayElemAt: [`$${relationField}`, 0] }, // Unwind the first populated result
            else: {
              $cond: {
                if: { $eq: [`$${relationField}`, null] },
                // biome-ignore lint/suspicious/noThenProperty: this is MongoDB syntax
                then: null,
                else: { $literal: { error: "Invalid reference" } },
              },
            },
          },
        },
      },
    });
  }
}

function buildPipelineOptions(
  projection: Projection<any>,
  options: RelationPopulationOptions<any>,
) {
  const pipeline: Lookup<any>["$lookup"]["pipeline"] = [];
  if (Object.keys(projection).length) {
    // @ts-ignore
    pipeline.push({ $project: projection });
  }
  addPipelineMetas(pipeline, {
    limit: options.limit,
    skip: options.skip,
    sort: options.sort,
  });
  return pipeline;
}

export function addPipelineMetas(
  pipeline: PipelineStage<any>[],
  options: {
    sort?: Sort["$sort"];
    skip?: Skip["$skip"];
    limit?: Limit["$limit"];
  },
) {
  if (options.sort) pipeline.push({ $sort: options.sort });
  if (options.skip) pipeline.push({ $skip: options.skip });
  if (options.limit) pipeline.push({ $limit: options.limit });
}

// TODO: handle all MongoSort variants
export function getSortDirection(
  order?: MongoSort,
): Record<string, 1 | -1 | Meta> | undefined {
  // Handle Record<string, SortDirection>
  const sortDirections: Record<string, 1 | -1 | Meta> = {};
  if (Array.isArray(order)) {
    for (const ord of order) {
      sortDirections[ord as string] = 1; // Default to ascending for each string in the array
    }
  } else if (typeof order === "object" && order !== null) {
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
  } else if (typeof order === "string") {
    sortDirections[order] = 1;
  } else if (order === 1) {
    // Handle case where order is explicitly set to 1
    sortDirections.$meta = 1; // or any other appropriate handling
  } else if (order === -1) {
    // Handle case where order is explicitly set to -1
    sortDirections.$meta = -1; // or any other appropriate handling
  }
  if (Object.keys(sortDirections).length) {
    return sortDirections;
  }
  return undefined;
}
