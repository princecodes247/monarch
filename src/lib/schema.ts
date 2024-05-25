import type { Collection } from "mongodb";
import { Database } from "./core";
import { transformCollectionName } from "./utils";
import type { MonarchSchemaType } from "./schema-type";

export interface SchemaDefinition {
	[K: string]: MonarchSchemaType<any>;
}

export type CreatedSchema<T extends SchemaDefinition> = {
	[K in keyof T]: ReturnType<T[K]["getDefault"]> | null;
};

class Schema<T extends SchemaDefinition> {
	private readonly collection: Collection<any>;
	constructor(
		private readonly collectionName: string,
		private readonly schemaDefinition: T,
	) {
		const transformedCollectionName = transformCollectionName(
			this.collectionName,
		);
		this.collection = Database.getInstance().getCollection(
			transformedCollectionName,
		);
	}
	private _parseInputData(
		data: CreatedSchema<T>,
	): Partial<CreatedSchema<T>> | null {
		const parsedData: Partial<CreatedSchema<T>> = {};
		for (const key in this.schemaDefinition) {
			const field = this.schemaDefinition[key];
			const value = data[key];
			console.log({ field, isReq: field.isRequired, value });
			// Check if the field is required
			if (field.isRequired && value === undefined) {
				throw new Error(`Field '${key}' is required.`);
			}

			// Check if the field is nullable
			if (field.isNullable && value === null) {
				parsedData[key] = null;
				continue;
			}
			// throw new Error(`Field '${key}' cannot be null.`);

			// Validate field types
			if (value !== undefined) {
				const expectedType = field.getInnerType();
				if ((typeof value).toString() !== expectedType) {
					throw new Error(`Field '${key}' must be of type '${expectedType}'.`);
				}
			}

			// Set default value if not provided
			parsedData[key] = value !== undefined ? value : field.getDefault();
		}
		return parsedData;
	}

	async insert(
		data: CreatedSchema<T>,
	): Promise<Partial<CreatedSchema<T>> | null> {
		const validatedData = this._parseInputData(data);
		if (!validatedData) {
			throw new Error("Validation failed");
		}
		console.log({ validatedData });
		// return null;
		const result = await this.collection.insertOne(validatedData);
		return {
			_id: result.insertedId,
			...validatedData,
		};
	}

	static createSchema<K extends SchemaDefinition>(
		collectionName: string,
		schemaDefinition: K,
		options?: any,
	): Schema<K> {
		return new Schema(collectionName, schemaDefinition);
	}
}

const createSchema = Schema.createSchema;

export { createSchema };
