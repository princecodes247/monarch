import { Collection, MongoClient, ObjectId } from "mongodb";
import type { CreatedSchema, SchemaDefinition } from "./old-schema";
import { Database } from "../adapter";

interface MongoType {
	_id: ObjectId;
}

// Define a model class
class Model<T extends SchemaDefinition> {
	private readonly collection: Collection<any>;

	constructor(
		private readonly collectionName: string,
		private readonly schema: T,
	) {
		this.collection = Database.getInstance().getCollection(this.collectionName);
	}

	async insert(
		data: CreatedSchema<T>,
	): Promise<CreatedSchema<T & MongoType> | null> {
		const validatedData = this.validateData(data);
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

	private validateData(data: any): CreatedSchema<T> | null {
		const validatedData: Partial<CreatedSchema<T>> = {};
		for (const key in this.schema) {
			if (Object.prototype.hasOwnProperty.call(this.schema, key)) {
				const type = this.schema[key];
				// Validate and cast each property
				const value = data[key];
				// Implement your validation logic here
				if (value === undefined && type.isRequired()) {
					throw new Error(`${key} is required`);
				}
				console.log({ type: type, key, schmea: this.schema });
				// Check if the value matches the specified type
				if (value !== undefined && typeof value !== type.getType()) {
					throw new Error(`${key} must be of type ${type.getInnerType()}`);
				}
				validatedData[key] = value;
			}
		}
		return validatedData as CreatedSchema<T>;
	}
}

export { Model };

// function generateClass(className: string, properties: { [key: string]: any }): any {
//     // Define the class dynamically
//     const generatedClass = class {
//         constructor() {
//             // Initialize properties based on input
//             for (const prop in properties) {
//                 if (properties.hasOwnProperty(prop)) {
//                     this[prop] = properties[prop];
//                 }
//             }
//         }

//         // Add methods to the class if needed
//         // For example:
//         // someMethod() {
//         //     // Method implementation
//         // }
//     };

//     // Set class name
//     Object.defineProperty(generatedClass, 'name', { value: className });

//     return generatedClass;
// }
