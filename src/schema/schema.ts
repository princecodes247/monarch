import type { Merge, Pretty, WithRequiredId } from "../type-helpers";
import type {
  AnyMonarchRelationType,
  AnyMonarchRootType,
  AnyMonarchType,
} from "../types/type";
import type { InferTypeObjectOutput } from "../types/type-helpers";
import {
  type Relations,
  RelationsProvider,
  type SchemaRelationDef,
} from "./refs";
import type {
  CreateIndex,
  InferSchemaData,
  InferSchemaInput,
  InferSchemaOutput,
  SchemaIndex,
  UniqueIndex,
} from "./type-helpers";

type SchemaOmit<
  T extends Record<string, AnyMonarchType>,
  R extends Record<string, AnyMonarchRelationType>,
> = { [K in keyof Merge<T, R>]?: true };

type SchemaVirtuals<
  T extends Record<string, AnyMonarchType>,
  R extends Record<string, AnyMonarchRelationType>,
  U extends Record<string, any>,
> = (
  values: Pretty<
    WithRequiredId<Merge<InferTypeObjectOutput<T>, InferTypeObjectOutput<R>>>
  >,
) => U;

type SchemaIndexes<
  T extends Record<string, AnyMonarchType>,
  R extends Record<string, AnyMonarchRelationType>,
> = (options: {
  createIndex: CreateIndex<Merge<T, R>>;
  unique: UniqueIndex<Merge<T, R>>;
}) => {
  [k: string]: SchemaIndex<Merge<T, R>>;
};

export class Schema<
  TName extends string,
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends SchemaRelationDef<TTypes>,
  TVirtuals extends Record<string, any>,
  TOmit extends SchemaOmit<TTypes, TRelations>,
> {
  constructor(
    public name: TName,
    public types: TTypes,
    public relations: TRelations,
    public options: {
      omit?: SchemaOmit<TTypes, TRelations>;
      virtuals?: SchemaVirtuals<TTypes, TRelations, TVirtuals>;
      indexes?: SchemaIndexes<TTypes, TRelations>;
    },
  ) {}

  public static toData<T extends AnySchema>(
    schema: T,
    data: InferSchemaInput<T>,
  ) {
    return schema.toData(data);
  }
  private toData(input: InferSchemaInput<this>): InferSchemaData<this> {
    const data = {} as InferSchemaData<this>;
    // @ts-ignore
    if (input._id) data._id = input._id;
    // parse fields
    for (const [key, type] of Object.entries(this.types)) {
      data[key as keyof typeof data] = type._parser(
        input[key as keyof InferSchemaInput<this>],
      );
    }
    return data;
  }

  public static fromData<T extends AnySchema>(
    schema: T,
    data: InferSchemaData<T>,
  ) {
    return schema.fromData(data);
  }
  private fromData(data: InferSchemaData<this>): InferSchemaOutput<this> {
    const output = data as unknown as InferSchemaOutput<this>;
    // add virtual fields
    const virtuals = this.options.virtuals?.({ ...data });
    if (virtuals) Object.assign(output, virtuals);
    // omit fields
    if (this.options?.omit) {
      for (const key of Object.keys(this.options.omit)) {
        // skip omit on virtual fields
        if (virtuals && key in virtuals) continue;
        delete output[key as keyof InferSchemaOutput<this>];
      }
    }
    return output;
  }

  public static getFieldUpdates<T extends AnySchema>(schema: T) {
    return schema.getFieldUpdates();
  }
  private getFieldUpdates(): Partial<InferSchemaOutput<this>> {
    const updates = {} as Partial<InferSchemaOutput<this>>;
    // omit fields
    for (const [key, type] of Object.entries(this.types)) {
      if (type._updateFn) {
        updates[key as keyof Partial<InferSchemaOutput<this>>] =
          type._updateFn();
      }
    }
    return updates;
  }

  omit<TOmit extends SchemaOmit<TTypes, TRelations>>(omit: TOmit) {
    const schema = this as unknown as Schema<
      TName,
      TTypes,
      TRelations,
      TVirtuals,
      TOmit
    >;
    schema.options.omit = omit;
    return schema;
  }

  virtuals<TVirtuals extends Record<string, any>>(
    virtuals: SchemaVirtuals<TTypes, TRelations, TVirtuals>,
  ) {
    const schema = this as unknown as Schema<
      TName,
      TTypes,
      TRelations,
      TVirtuals,
      TOmit
    >;
    schema.options.virtuals = virtuals;
    return schema;
  }

  indexes(indexes: SchemaIndexes<TTypes, TRelations>) {
    this.options.indexes = indexes;
    return this;
  }

  withRelations<T extends SchemaRelationDef<TTypes>>(
    fn: (relations: Relations<this>) => T,
  ) {
    const schema = this as unknown as Schema<
      TName,
      TTypes,
      Pretty<Merge<TRelations, T>>,
      TVirtuals,
      SchemaOmit<TTypes, Merge<TRelations, T>>
    >;
    schema.relations = {
      ...schema.relations,
      ...fn(new RelationsProvider(this)),
    };
    return schema;
  }
}

export function createSchema<
  TName extends string,
  TTypes extends Record<string, AnyMonarchRootType>,
>(name: TName, types: TTypes): Schema<TName, TTypes, {}, {}, {}> {
  return new Schema(name, types, {}, {});
}

export function makeIndexes<
  T extends Record<string, AnyMonarchType>,
  R extends Record<string, AnyMonarchRelationType>,
>(indexesFn: SchemaIndexes<T, R>) {
  return indexesFn({
    createIndex: (fields, options) => [fields, options],
    unique: (field) => [{ [field as any]: 1 as const }, { unique: true }],
  });
}

export type AnySchema = Schema<any, any, any, any, any>;
export type AnySchemaWithoutRelations = Schema<
  any,
  any,
  { [k: string]: never },
  any,
  any
>;
