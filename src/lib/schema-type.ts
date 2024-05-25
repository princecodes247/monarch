interface MonarchSchemaTypeDef<T> {
	type: any;
}

enum MonarchSchemaTypeKind {
	MonarchString = "string",
	MonarchNumber = "number",
}

export abstract class MonarchSchemaType<K> {
	protected readonly _def!: MonarchSchemaTypeDef<K>;
	protected readonly _typeName!: MonarchSchemaTypeKind;
	protected _default!: K | null | undefined;
	protected _required!: boolean;
	protected _nullable!: boolean;

	constructor(def: MonarchSchemaTypeDef<K>) {
		this._def = def;
		this._required = true;
		this._nullable = false;
		this._default = undefined;
	}

	getDefinition(): MonarchSchemaTypeDef<K> {
		return this._def;
	}

	getInnerType() {
		return this._typeName;
	}

	getType() {
		return this._typeName;
	}

	getDefault() {
		return this._default;
	}
	default(value: K): this {
		this._default = value;
		return this;
	}
	get isRequired(): boolean {
		return !!this._required;
	}

	get isNullable(): boolean {
		return !!this._nullable;
	}

	required(): this {
		this._required = true;
		return this;
	}
	optional(): this {
		this._required = false;
		return this;
	}
	nullable(): this {
		this._nullable = true;
		this._default = null;
		return this;
	}
}

class MonarchString extends MonarchSchemaType<string> {
	protected readonly _typeName = MonarchSchemaTypeKind.MonarchString;

	static create(): MonarchString {
		return new MonarchString({
			type: MonarchSchemaTypeKind.MonarchString,
		});
	}
}

class MonarchNumber extends MonarchSchemaType<number> {
	protected readonly _typeName = MonarchSchemaTypeKind.MonarchNumber;

	static create(): MonarchNumber {
		return new MonarchNumber({
			type: MonarchSchemaTypeKind.MonarchNumber,
		});
	}
}

const string = MonarchString.create;
const number = MonarchNumber.create;

export { string, number };
