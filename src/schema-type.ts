import { MonarchTransformations } from "./value-transformation";

interface MonarchSchemaTypeDef<T> {
  type: any;
}

enum MonarchSchemaTypeKind {
  MonarchString = "string",
  MonarchNumber = "number",
}

export abstract class MonarchSchemaType<K> extends MonarchTransformations<K> {
  protected _def!: MonarchSchemaTypeDef<K>;
  protected _type!: MonarchSchemaTypeKind;
  protected _default: K | null | undefined = undefined;
  protected _required = true;
  protected _nullable = false;

  constructor(def: MonarchSchemaTypeDef<K>) {
    super();
    this._def = def;
  }

  abstract parse(value: unknown): K;

  baseParse(value: unknown): K | null | undefined {
    let newValue: K | null | undefined = undefined;

    if (this.isRequired && value === undefined) {
      throw new Error("Field is required.");
    }

    if (this.isNullable && value === null) {
      newValue = null;
    }

    if (value !== undefined) {
      if ((typeof value).toString() !== this.getInnerType()) {
        throw new Error(`Field must be of type '${this.getInnerType()}'.`);
      }
      newValue = value as K;
    }
    newValue = newValue !== undefined ? newValue : this.getDefault();

    return newValue;
  }

  getInnerType(): MonarchSchemaTypeKind {
    return this._def.type;
  }

  getDefault(): K | null | undefined {
    return this._default;
  }

  default(value: K): this {
    this._default = value;
    return this;
  }

  get isRequired(): boolean {
    return this._required;
  }

  get isNullable(): boolean {
    return this._nullable;
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
  protected readonly _type = MonarchSchemaTypeKind.MonarchString;

  constructor(def: MonarchSchemaTypeDef<string>) {
    super(def);
    this.addTransformation((value: string) => String(value));
  }
  static create(): MonarchString {
    return new MonarchString({
      type: MonarchSchemaTypeKind.MonarchString,
    });
  }

  parse(value: unknown): string {
    if (typeof value !== "string" && this._required)
      // throw new Error(`Field '${value}' must be of type string`);
      throw new Error(`Field '${value}' is required`);
    return this.applyTransformation(value as string);
  }

  uppercase(): this {
    this.addTransformation((value: string) => value.toUpperCase());
    return this;
  }

  lowercase(): this {
    this.addTransformation((value: string) => value.toLowerCase());
    return this;
  }
}

class MonarchNumber extends MonarchSchemaType<number> {
  protected readonly _type = MonarchSchemaTypeKind.MonarchNumber;

  static create(): MonarchNumber {
    return new MonarchNumber({
      type: MonarchSchemaTypeKind.MonarchNumber,
    });
  }

  parse(value: unknown): number {
    if (typeof value !== "number" && this._required)
      throw new Error("Not a number");
    return Number(value);
  }
}

export type MonarchType = MonarchString | MonarchNumber;
export type Infer<T extends MonarchType> = T extends MonarchString
  ? string
  : T extends MonarchNumber
  ? number
  : "invalid type";

const string = MonarchString.create;
const number = MonarchNumber.create;

export { number, string };
