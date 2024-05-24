import { Collection } from "mongodb";
import { Database } from "./adapter";

import { getTypeFromString } from "./utils";

export interface SchemaDefinition {
	[K: string]: MonarchType<any>;
}

export type CreatedSchema<T extends SchemaDefinition> = {
	[K in keyof T]: ReturnType<T[K]["getDefault"]>;
};

interface MonarchTypeDef<T> {
	type: any;
}

enum MonarchTypeKind {
	MonarchString = "string",
	MonarchNumber = "number",
}

abstract class MonarchType<K> {
	protected readonly _def!: MonarchTypeDef<K>;
	protected readonly _typeName!: MonarchTypeKind;
	protected _default!: K | undefined;
	protected _required!: boolean;

	constructor(def: MonarchTypeDef<K>) {
		this._def = def;
	}

	getDefinition(): MonarchTypeDef<K> {
		return this._def;
	}

	getInnerType() {
		return this._typeName;
	}

	getType() {
		return this._typeName;
	}

	get isRequired(): boolean {
		return !!this._required;
	}

	required(value = true): this {
		this._required = value;
		return this;
	}
	getDefault() {
		return this._default;
	}
	default(value: K): this {
		this._default = value;
		return this;
	}
}

class MonarchString extends MonarchType<string> {
	protected readonly _typeName = MonarchTypeKind.MonarchString;
	protected _default = "";

	static create(): MonarchString {
		return new MonarchString({
			type: MonarchTypeKind.MonarchString,
		});
	}
}

class MonarchNumber extends MonarchType<number> {
	protected readonly _typeName = MonarchTypeKind.MonarchNumber;
	protected _default = 0;

	static create(): MonarchNumber {
		return new MonarchNumber({
			type: MonarchTypeKind.MonarchNumber,
		});
	}
}

const string = MonarchString.create;
const number = MonarchNumber.create;

export { string, number };

class Schema<T extends SchemaDefinition> {
	private readonly collection: Collection<any>;
	constructor(
		private readonly collectionName: string,
		private readonly schemaDefinition: T,
	) {
		this.collection = Database.getInstance().getCollection(this.collectionName);
	}
	private _parseData(data: CreatedSchema<T>): Partial<CreatedSchema<T>> | null {
		const parsedData: Partial<CreatedSchema<T>> = {};
		for (const key in this.schemaDefinition) {
			const field = this.schemaDefinition[key];
			const value = data[key];

			// Check if the field is required
			if (field.isRequired && value === undefined) {
				throw new Error(`Field '${key}' is required.`);
			}

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
		const validatedData = this._parseData(data);
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

	static create<K extends SchemaDefinition>(
		collectionName: string,
		schemaDefinition: K,
		options?: any,
	): Schema<K> {
		return new Schema(collectionName, schemaDefinition);
	}
}

const createSchema = Schema.create;

export { createSchema };
