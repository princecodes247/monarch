import { Sort as MongoSort } from "mongodb";
import { MonarchMany, MonarchRef } from "../../types/refs";
import { PipelineStage } from "../types/pipeline-stage";


export const generatePopulatePipeline = (relation: any, relationKey: string): PipelineStage<any>[] => {

  if(!relation) return []
  const foreignField = relation.options?.field;
  const target = relation.options?.references  
  const collectionName = relation.target?.name
  // console.log({
  //   options: relation.options,
  //   target: relation.target,
  // })
  if(!target || !collectionName) return []

  const fieldVariable = `monarch_${relationKey}_${foreignField}_var`
  const fieldData = `monarch_${relationKey}_data`
  const type = inferRelationType(relation)

  const pipeline: PipelineStage<any>[] = [];

  // console.log({
  //   // relation,
  //   fieldVariable,
  //   opts: {
  //     from: collectionName,
  //     localField: relationKey,
  //     foreignField: "_id",
  //     as: relationKey,
  //   },
  // });

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
        let: { [fieldVariable]: `$${target ?? relationKey}` },
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
    if (type === "single") {
      pipeline.push({ $unwind: `$${fieldData}` });
    }

    // Replace the original field with the populated data
    pipeline.push(
      { $unset: relationKey }, 
      { $set: { [relationKey]: `$${fieldData}` } }, // Set the populated data
      { $unset: fieldData } // Clean up the temp fieldData
    );
  }

  return pipeline;
};

export const inferRelationType = (relation: any): 'many' | 'ref' | 'single' => {
  if (relation instanceof MonarchMany) return 'many';
  if (relation instanceof MonarchRef) return 'ref';
  return 'single';
}

export const generatePopulationMetas = ({
  sort,
  skip,
  limit
}: {
  sort?: Record<string, 1 | -1 | Meta>,
  skip?: number,
  limit?: number
}) => {
  const metas: PipelineStage<any>[] = [];
  if (sort) {
    metas.push({ $sort: {
      anyone: 1
    } });
  }
  if (skip !== undefined) {
    metas.push({ $skip: skip });
  }
  if (limit !== undefined) {
    metas.push({ $limit: limit });
  }
  return metas;
};

type Meta = { $meta: string }; // Define the Meta type based on your specific use case


export const getSortDirection = (
  order?: MongoSort
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
        sortDirections[key] = value as Meta
      }
    }
    return sortDirections;
  }

  return {};
};

