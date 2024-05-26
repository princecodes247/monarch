import { type Collection, ObjectId } from "mongodb";
import { Database } from "./core";
import {
  DeleteOneQuery,
  FindOneQuery,
  FindQuery,
  UpdateOneQuery,
} from "./query-builder";
import type { Infer } from "./schema-type";
import type { CreatedSchema, SchemaDefinition } from "./types";
import { transformCollectionName } from "./utils";

class Schema<T extends SchemaDefinition> {
  private readonly collection: Collection<any>;
  constructor(
    private readonly collectionName: string,
    private readonly schemaDefinition: T
  ) {
    const transformedCollectionName = transformCollectionName(
      this.collectionName
    );
    this.collection = Database.getInstance().getCollection(
      transformedCollectionName
    );
  }
  private _parseInputData(
    data: CreatedSchema<T>
  ): Partial<CreatedSchema<T>> | null {
    const parsedData: Partial<CreatedSchema<T>> = {};
    for (const key in this.schemaDefinition) {
      const field = this.schemaDefinition[key];
      const value = data[key];

      parsedData[key] = field.parse(value) as Infer<
        T[Extract<keyof T, string>]
      >;
    }
    return parsedData;
  }

  async insert(
    data: CreatedSchema<T>
  ): Promise<Partial<CreatedSchema<T>> | null> {
    const validatedData = this._parseInputData(data);
    if (!validatedData) {
      throw new Error("Validation failed");
    }
    console.log({ validatedData });
    // return null;
    const result = await this.collection.insertOne(validatedData);
    console.log({ result });
    return {
      _id: result.insertedId,
      ...validatedData,
    };
  }

  static createSchema<K extends SchemaDefinition>(
    collectionName: string,
    schemaDefinition: K,
    options?: any
  ): Schema<K> {
    return new Schema(collectionName, schemaDefinition);
  }

  find(): FindQuery<CreatedSchema<T>> {
    return new FindQuery(this.collection);
  }

  findOne(id: string): FindOneQuery<CreatedSchema<T>> {
    return new FindOneQuery(this.collection).where({ _id: new ObjectId(id) });
  }

  updateOne(id: string, update: any): UpdateOneQuery<CreatedSchema<T>> {
    return new UpdateOneQuery(this.collection, update).where({
      _id: new ObjectId(id),
    });
  }

  deleteOne(id: string): DeleteOneQuery<CreatedSchema<T>> {
    return new DeleteOneQuery(this.collection).where({ _id: new ObjectId(id) });
  }
}

const createSchema = Schema.createSchema;

export { createSchema };
