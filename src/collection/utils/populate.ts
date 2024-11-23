import type { Sort as MongoSort } from "mongodb";
import {
  type AnyMonarchRelation,
  MonarchRelation,
} from "../../schema/relations/base";
import { MonarchMany } from "../../schema/relations/many";
import { MonarchOne } from "../../schema/relations/one";
import { MonarchRef } from "../../schema/relations/ref";
import type { Limit, PipelineStage, Skip } from "../types/pipeline-stage";

type PopulationOptions =
  | true
  | {
      limit?: number;
      skip?: number;
      select?: Record<string, 1 | 0>;
      omit?: Record<string, 1 | 0>;
      sort?: Record<string, 1 | -1>;
    };
/**
 * Adds population stages to an existing MongoDB pipeline for relation handling
 * @param pipeline - The MongoDB pipeline array to modify
 * @param relationField - The field name containing the relation
 * @param relation - The Monarch relation configuration
 */
export function addPopulatePipeline(
  pipeline: PipelineStage<any>[],
  relationField: string,
  relation: AnyMonarchRelation,
  options?: PopulationOptions,
) {
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
        pipeline: buildPipelineOptions(options),
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

  if (type instanceof MonarchRef) {
    const collectionName = type._target.name;
    const foreignField = type._field;
    const sourceField = type._references;
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
          ...buildPipelineOptions(options),
        ],
        as: relationField,
      },
    });
  }

  if (type instanceof MonarchOne) {
    const collectionName = type._target.name;
    const foreignField = type._field;
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
          ...buildPipelineOptions(options),
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

const buildPipelineOptions = (
  options?: PopulationOptions,
  isMonarchOne = false,
) => {
  const optionsPipeline = [];
  if (options && typeof options !== "boolean") {
    if (options.select || options.omit) {
      const projection = Object.keys(
        options.select || options.omit || {},
      ).reduce(
        (acc, key) => {
          acc[key] = options.select ? 1 : 0;
          return acc;
        },
        {} as Record<string, 1 | 0>,
      );
      optionsPipeline.push({ $project: projection });
    }
    addPopulationMetas(optionsPipeline, {
      limit: isMonarchOne ? 1 : options.limit,
      skip: !isMonarchOne ? options.skip : undefined,
      sort: options.sort,
    });
  }

  return optionsPipeline;
};

export const addPopulationMetas = (
  pipeline: PipelineStage<any>[],
  options: {
    sort?: MongoSort;
    skip?: Skip["$skip"];
    limit?: Limit["$limit"];
  },
) => {
  if (options.sort) pipeline.push({ $sort: getSortDirection(options.sort) });
  if (options.skip) pipeline.push({ $skip: options.skip });
  if (options.limit) pipeline.push({ $limit: options.limit });
};

type Meta = { $meta: any };

export const getSortDirection = (
  order?: MongoSort,
): Record<string, 1 | -1 | Meta> => {
  // Handle Record<string, SortDirection>
  const sortDirections: Record<string, 1 | -1 | Meta> = {};
  if (typeof order === "object" && order !== null) {
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
  if (typeof order === "string") {
    sortDirections[order] = 1;
    return sortDirections;
  }
  if (Array.isArray(order)) {
    for (const ord of order) {
      sortDirections[ord] = 1; // Default to ascending for each string in the array
    }
    return sortDirections;
  }
  if (order === 1) {
    // Handle case where order is explicitly set to 1
    return { $meta: 1 }; // or any other appropriate handling
  }
  if (order === -1) {
    // Handle case where order is explicitly set to -1
    return { $meta: -1 }; // or any other appropriate handling
  }

  return {};
};
