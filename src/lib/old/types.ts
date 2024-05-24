import { getTypeFromString } from "../utils";

export interface SchemaDefinition {
	[K: string]: MonarchType<any>;
}

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
		return getTypeFromString(this._typeName);
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
