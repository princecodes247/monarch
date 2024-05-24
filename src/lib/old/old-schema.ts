import { getTypeFromString } from "./utils";

export interface SchemaDefinition {
	[K: string]: MonarchType<any>;
}

interface MonarchModifier {
	name: MonarchPropertyModifier;
	value: any;
}

interface MonarchTypeDef<T> {
	type: any;
	innerType?: T;
	modifiers: MonarchModifier[];
	validations: {
		[K in MonarchPropertyModifier]?: K extends keyof T ? T[K] : never;
	};
}

enum MonarchPropertyModifier {
	Required = "required",
	Default = "default",
}

enum MonarchFirstPartyTypeKind {
	MonarchString = "string",
	MonarchNumber = "number",
}

abstract class MonarchType<K> {
	protected readonly _def!: MonarchTypeDef<K>;
	protected readonly _typeName!: MonarchFirstPartyTypeKind;
	protected _default!: K | undefined;

	constructor(def: MonarchTypeDef<K>) {
		this._def = def;
	}

	getDefinition(): MonarchTypeDef<K> {
		return this._def;
	}

	getInnerType() {
		return getTypeFromString(this._typeName);
	}

	getType(): "string" | "number" {
		return this._typeName;
	}

	isRequired(): boolean {
		return !!this._def?.validations.required;
	}

	protected _addModifier(modifier: MonarchModifier): this {
		const res = generateMonarchPropertyClass(this._typeName, {
			...this.getDefinition(), // Using getDefinition method to access _def
			modifiers: [...this.getDefinition().modifiers, modifier], // Accessing modifiers via getDefinition
		});

		return res as this; // Cast res to this type
	}

	protected _addValidation(modifier: MonarchModifier): this {
		const res = generateMonarchPropertyClass(this._typeName, {
			...this.getDefinition(), // Using getDefinition method to access _def
			validations: {
				...this.getDefinition().validations,
			},
		});

		return res as this; // Cast res to this type
	}

	required(value = true): this {
		return this._addValidation({
			name: MonarchPropertyModifier.Required,
			value,
		});
	}
	getDefault() {
		return this._default;
	}
	default(value: MonarchTypeDef<K>["innerType"]): this {
		this._default = value;
		return this;
	}
}

class MonarchString extends MonarchType<string> {
	protected readonly _typeName = MonarchFirstPartyTypeKind.MonarchString;
	protected _default = "";

	static create(): MonarchString {
		return new MonarchString({
			modifiers: [],
			validations: {},
			type: MonarchFirstPartyTypeKind.MonarchString,
		});
	}
}

class MonarchNumber extends MonarchType<number> {
	protected readonly _typeName = MonarchFirstPartyTypeKind.MonarchNumber;
	protected _default = 0;

	static create(): MonarchNumber {
		return new MonarchNumber({
			modifiers: [],
			validations: {},
			type: MonarchFirstPartyTypeKind.MonarchNumber,
		});
	}
}

function generateMonarchPropertyClass(
	kind: MonarchFirstPartyTypeKind,
	params: MonarchTypeDef<any>,
): MonarchType<any> {
	switch (kind) {
		case MonarchFirstPartyTypeKind.MonarchString:
			return new MonarchString(params);
		case MonarchFirstPartyTypeKind.MonarchNumber:
			return new MonarchNumber(params);
		default:
			return new MonarchString(params);
	}
}

// export type CreatedSchema<T extends SchemaDefinition> = {
// 	[K in keyof T]: ReturnType<T[K]["isRequired"]> extends true
// 		? ReturnType<T[K]["getInnerType"]>
// 		: ReturnType<T[K]["getInnerType"]> | undefined;
// };

export type CreatedSchema<T extends SchemaDefinition> = {
	[K in keyof T]: ReturnType<T[K]["getDefault"]>;
};

// Define the createSchema function
const createSchema = <T extends SchemaDefinition>(schemaDefinition: T) => {
	const schema: CreatedSchema<T> = {} as CreatedSchema<T>;

	for (const key in schemaDefinition) {
		if (Object.prototype.hasOwnProperty.call(schemaDefinition, key)) {
			const type = schemaDefinition[key];
			console.log({ type, key, schemaDefinition });

			schema[key] = type.getDefault();
		}
	}

	console.log({ schema });
	// Assert schema is of type CreatedSchema<T>
	return schema;
};

const string = MonarchString.create;
const number = MonarchNumber.create;

export { createSchema, string, number };
