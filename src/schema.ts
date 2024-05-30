import type { Infer } from "./schema-type";
import type { CreatedSchema, SchemaDefinition } from "./types";

export class Schema<T extends SchemaDefinition> {
  schemaDefinition: T;

  constructor(readonly collectionName: string, schemaDefinition: T) {
    this.schemaDefinition = schemaDefinition;
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

  get schemaDef(): T {
    return this.schemaDefinition;
  }

  static createSchema<K extends SchemaDefinition>(
    collectionName: string,
    schemaDefinition: K,
    options?: any
  ): Schema<K> {
    return new Schema(collectionName, schemaDefinition);
  }
}

const createSchema = Schema.createSchema;

export { createSchema };
