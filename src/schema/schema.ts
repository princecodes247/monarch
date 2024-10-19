import type { Projection } from "../collection/types/query-options";
import { detectProjection } from "../collection/utils/projection";
import type { Merge, Pretty, WithOptionalId } from "../type-helpers";
import type {
  AnyMonarchRelationType,
  AnyMonarchRootType,
  AnyMonarchType,
} from "../types/type";
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
import type { Virtual } from "./virtuals";

type SchemaOmit<
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends Record<string, AnyMonarchRelationType>,
> = { [K in keyof Merge<WithOptionalId<TTypes>, TRelations>]?: true };

type SchemaVirtuals<
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends Record<string, AnyMonarchRelationType>,
  TVirtuals extends Record<
    string,
    Virtual<Merge<TTypes, TRelations>, any, any>
  >,
> = TVirtuals;

type SchemaIndexes<
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends Record<string, AnyMonarchRelationType>,
> = (options: {
  createIndex: CreateIndex<Merge<TTypes, TRelations>>;
  unique: UniqueIndex<Merge<TTypes, TRelations>>;
}) => {
  [k: string]: SchemaIndex<Merge<TTypes, TRelations>>;
};

export class Schema<
  TName extends string,
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends SchemaRelationDef<TTypes> = {},
  TOmit extends SchemaOmit<TTypes, TRelations> = {},
  TVirtuals extends Record<string, Virtual<any, any, any>> = {},
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
    projection: Projection<InferSchemaOutput<T>>,
    forceOmit: string[] | null,
  ) {
    return schema.fromData(data, projection, forceOmit);
  }
  private fromData(
    data: InferSchemaData<this>,
    projection: Projection<InferSchemaOutput<this>>,
    forceOmit: string[] | null,
  ): InferSchemaOutput<this> {
    const output = data as unknown as InferSchemaOutput<this>;
    if (this.options.virtuals) {
      const { isProjected } = detectProjection(projection);
      for (const [key, virtual] of Object.entries(this.options.virtuals)) {
        // skip omitted virtual field
        if (isProjected(key)) {
          // @ts-expect-error
          output[key] = virtual.output(data);
        }
      }
    }
    // delete other fields that might have been added as input to a virtual or returned during insert
    if (forceOmit) {
      for (const key of forceOmit) {
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
        updates[key as keyof InferSchemaOutput<this>] = type._updateFn();
      }
    }
    return updates;
  }

  omit<TOmit extends SchemaOmit<TTypes, TRelations>>(omit: TOmit) {
    const schema = this as unknown as Schema<
      TName,
      TTypes,
      TRelations,
      TOmit,
      TVirtuals
    >;
    schema.options.omit = omit;
    return schema;
  }

  virtuals<
    TVirtuals extends Record<
      string,
      Virtual<Pretty<Merge<TTypes, TRelations>>, any, any>
    >,
  >(virtuals: SchemaVirtuals<TTypes, TRelations, TVirtuals>) {
    const schema = this as unknown as Schema<
      TName,
      TTypes,
      TRelations,
      TOmit,
      TVirtuals
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
      SchemaOmit<TTypes, Merge<TRelations, T>>,
      TVirtuals
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
