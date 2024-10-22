import type {
  Filter,
  FindOptions,
  Collection as MongoCollection,
  Sort as MongoSort,
} from "mongodb";
import type { SchemaRelationSelect } from "../../schema/refs";
import { type AnySchema, Schema } from "../../schema/schema";
import type {
  InferSchemaData,
  InferSchemaOmit,
  InferSchemaOutput,
} from "../../schema/type-helpers";
import type { Pretty, TrueKeys } from "../../type-helpers";
import { PipelineStage } from "../types/pipeline-stage";
import type {
  BoolProjection,
  Projection,
  Sort,
  WithProjection,
} from "../types/query-options";
import { generatePopulatePipeline, generatePopulationMetas, getSortDirection } from "../utils/populate";
import {
  addExtraInputsToProjection,
  makeProjection,
} from "../utils/projection";
import { Query } from "./base";

export class FindQuery<
  T extends AnySchema,
  O = WithProjection<"omit", InferSchemaOutput<T>, InferSchemaOmit<T>>,
> extends Query<T, O[]> {
  private _projection: Projection<InferSchemaOutput<T>>;
  private _population: SchemaRelationSelect<T> = {};

  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
    private _filter: Filter<InferSchemaData<T>>,
    private _options: FindOptions = {},
  ) {
    super(_schema, _collection, _readyPromise);
    this._projection = makeProjection("omit", _schema.options.omit ?? {});
  }

  public options(options: FindOptions): this {
    Object.assign(this._options, options);
    return this;
  }

  public sort(sort: Sort<InferSchemaOutput<T>>): this {
    this._options.sort = sort as MongoSort;
    return this;
  }

  public limit(limit: number): this {
    this._options.limit = limit;
    return this;
  }

  public skip(skip: number): this {
    this._options.skip = skip;
    return this;
  }

  public omit<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("omit", projection);
    return this as FindQuery<
      T,
      WithProjection<"omit", InferSchemaOutput<T>, TrueKeys<P>>
    >;
  }

  public select<P extends BoolProjection<InferSchemaOutput<T>>>(projection: P) {
    this._projection = makeProjection("select", projection);
    return this as FindQuery<
      T,
      WithProjection<"select", InferSchemaOutput<T>, TrueKeys<P>>
    >;
  }

  public populate<P extends Pretty<SchemaRelationSelect<T>>>(population: P) {
    Object.assign(this._population, population);
    return this as FindQuery<T, InferSchemaOutput<T>>;
  }


  public async exec(): Promise<O[]> {
    await this._readyPromise;
    if (Object.keys(this._population).length) {
      return this._execWithPopulate();
    }
    return this._execWithoutPopulate();
  }

  private async _execWithoutPopulate(): Promise<O[]> {
    const extra = addExtraInputsToProjection(
      this._projection,
      this._schema.options.virtuals,
    );
    const res = await this._collection
      .find(this._filter, { ...this._options, projection: this._projection })
      .map(
        (doc) =>
          Schema.fromData(
            this._schema,
            doc as InferSchemaData<T>,
            this._projection,
            extra,
          ) as O,
      )
      .toArray();
    return res;
  }

  private async _execWithPopulate(): Promise<O[]> {
    try {
    const pipeline: PipelineStage<InferSchemaOutput<T>>[] = [
      // @ts-expect-error
      { $match: this._filter },
    ];
    for (const [relationKey, shouldPopulate] of Object.entries(this._population)) {
      if (!shouldPopulate) continue;
      const relation = this._schema.relations[relationKey];
      pipeline.push(...generatePopulatePipeline(relation, relationKey))

      pipeline.push(...generatePopulationMetas({
        limit: this._options.limit,
        skip: this._options.skip,
        sort: getSortDirection(this._options.sort)
      }));
    }
    const result = await this._collection.aggregate(pipeline).toArray();
    return result.length > 0
      ?  result.map(
        (doc) =>
          Schema.fromData(
            this._schema,
            doc as InferSchemaData<T>,
            this._projection,
            null,
          ) as O,
      )
      : [];
    } catch (error) {
      console.error("Error executing population query:", error);
      // throw new MonarchError("Error executing population query");
      return [];
    }
  }
}
