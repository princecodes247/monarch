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

			field.parse(value);
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
		// const result = await this.collection.insertOne(validatedData);
		return {
			// _id: result.insertedId,
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
