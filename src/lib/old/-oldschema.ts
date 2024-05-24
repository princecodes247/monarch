// src/schema.ts
type Validator<T> = (value: T) => boolean;

type SchemaDefinition<T> = {
	[K in keyof T]: {
		type: string;
		validators: Validator<T[K]>[];
	};
};

type SchemaType<T> = {
	string(): SchemaType<string>;
	number(): SchemaType<number>;
	boolean(): SchemaType<boolean>;
	date(): SchemaType<Date>;
	required(): SchemaType<T>;
};

class Schema<T extends Record<string, any>> {
	private schema: SchemaDefinition<T>;

	constructor(schema: SchemaDefinition<T>) {
		this.schema = schema;
	}

	validate(data: any): data is T {
		for (const key in this.schema) {
			if (this.schema.hasOwnProperty(key)) {
				const value = data[key];
				const fieldSchema = this.schema[key];
				if (!fieldSchema.validators.every((validator) => validator(value))) {
					return false;
				}
			}
		}
		return true;
	}

	getFields(): Array<keyof T> {
		return Object.keys(this.schema) as Array<keyof T>;
	}
}

function createSchema<T extends Record<string, any>>(): SchemaType<T> {
	const schema: SchemaDefinition<T> = {} as any;
	const proxy = new Proxy(schema, {
		get(target, prop, receiver) {
			console.log({ target, prop, receiver });
			if (
				prop === "string" ||
				prop === "number" ||
				prop === "boolean" ||
				prop === "required"
			) {
				return () => {
					return { type: prop.toString(), validators: [] };
				};
			}
			if (prop === "required") {
				return (field: SchemaType<any>) => {
					// field.validators.push(
					// 	(value: any) => value !== undefined && value !== null,
					// );
					return field;
				};
			}
			return Reflect.get(target, prop, receiver);
		},
	}) as any;
	return proxy;
}

export { Schema, createSchema };
