import { Pretty, WithRequiredId } from "../type-helpers";
import { MonarchType } from "../types/type";
import { InferTypeObjectOutput } from "../types/type-helpers";
import {
  CreateIndex,
  InferSchemaData,
  InferSchemaInput,
  InferSchemaOutput,
  SchemaIndex,
  UniqueIndex,
} from "./type-helpers";

type SchemaOmit<K extends keyof any> = Record<K, true>;

type SchemaVirtuals<
  T extends Record<string, MonarchType<any>>,
  U extends Record<string, any>
> = (values: Pretty<WithRequiredId<InferTypeObjectOutput<T>>>) => U;

type SchemaIndexes<T extends Record<string, MonarchType<any>>> = (options: {
  createIndex: CreateIndex<T>;
  unique: UniqueIndex<T>;
}) => {
  [k: string]: SchemaIndex<T>;
};

export class Schema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TVirtuals extends Record<string, any>,
  TOmit extends keyof TTypes | "_id"
> {
  constructor(
    public name: TName,
    public types: TTypes,
    public options?: {
      omit?: SchemaOmit<TOmit>;
      virtuals?: SchemaVirtuals<TTypes, TVirtuals>;
      indexes?: SchemaIndexes<TTypes>;
    }
  ) {}

  toData(data: InferSchemaInput<this>): InferSchemaData<this> {
    const parsed = {} as InferSchemaData<this>;
    // @ts-ignore
    if (data._id) parsed._id = data._id;
    // parse fields
    for (const [key, type] of Object.entries(this.types)) {
      parsed[key as keyof TTypes] = type._parser(
        data[key as keyof InferSchemaInput<this>]
      );
    }
    return parsed;
  }

  fromData(data: InferSchemaData<this>): InferSchemaOutput<this> {
    const parsed = data as InferSchemaOutput<this>;
    // omit fields
    if (this.options?.omit) {
      for (const key of Object.keys(this.options.omit)) {
        delete data[key];
      }
    }
    // add virtual fields
    if (this.options?.virtuals) {
      Object.assign(data, this.options.virtuals({ ...data }));
    }
    return parsed;
  }
}

export type AnySchema = Schema<any, any, any, any>;

export function createSchema<
  TName extends string,
  TTypes extends Record<string, MonarchType<any>>,
  TVirtuals extends Record<string, any> = {},
  TOmit extends keyof TTypes | "_id" = keyof TTypes | "_id"
>(
  name: TName,
  types: TTypes,
  options?: {
    omit?: SchemaOmit<TOmit>;
    virtuals?: SchemaVirtuals<TTypes, TVirtuals>;
    indexes?: SchemaIndexes<TTypes>;
  }
): Schema<
  TName,
  TTypes,
  TVirtuals,
  keyof TTypes | "_id" extends TOmit ? never : TOmit
> {
  return new Schema(name, types, options);
}

export function makeIndexes<T extends Record<string, MonarchType<any>>>(
  indexesFn: SchemaIndexes<T>
) {
  return indexesFn({
    createIndex: (fields, options) => [fields, options],
    unique: (field) => [{ [field as any]: 1 as const }, { unique: true }],
  });
}
