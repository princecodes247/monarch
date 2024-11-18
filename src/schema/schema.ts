import type { Projection } from "../collection/types/query-options";
import { detectProjection } from "../collection/utils/projection";
import type { Merge, Pretty, WithOptionalId } from "../type-helpers";
import { type AnyMonarchType, MonarchType, phantom } from "../types/type";
import type { InferTypeOutput } from "../types/type-helpers";
import type { AnyMonarchRelation, MonarchRelation } from "./relations/base";
import { type Relations, relations } from "./relations/relations";
import type {
  CreateIndex,
  InferSchemaData,
  InferSchemaInput,
  InferSchemaOutput,
  InferSchemaRelations,
  InferSchemaTypes,
  SchemaIndex,
  UniqueIndex,
} from "./type-helpers";
import type { Virtual } from "./virtuals";

type SchemaRelation<T extends Record<string, AnyMonarchType>> = {
  [k: string]: AnyMonarchRelation;
} & {
  [K in keyof T]?: MonarchRelation<any, InferTypeOutput<T[K]>>;
};

type SchemaOmit<
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends Record<string, AnyMonarchRelation>,
> = { [K in keyof Merge<WithOptionalId<TTypes>, TRelations>]?: true };

type SchemaVirtuals<
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends Record<string, AnyMonarchRelation>,
  TVirtuals extends Record<
    string,
    Virtual<Merge<TTypes, TRelations>, any, any>
  >,
> = TVirtuals;

type SchemaIndexes<
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends Record<string, AnyMonarchRelation>,
> = (options: {
  createIndex: CreateIndex<Merge<TTypes, TRelations>>;
  unique: UniqueIndex<Merge<TTypes, TRelations>>;
}) => {
  [k: string]: SchemaIndex<Merge<TTypes, TRelations>>;
};

export type AnySchema = Schema<any, any, any, any, any>;
export type AnySchemaWithoutRelations = Schema<
  any,
  any,
  { [k: string]: never },
  any,
  any
>;

export class Schema<
  TName extends string,
  TTypes extends Record<string, AnyMonarchType>,
  TRelations extends SchemaRelation<any> = {},
  TOmit extends SchemaOmit<any, any> = {},
  TVirtuals extends Record<string, Virtual<any, any, any>> = {},
> {
  constructor(
    public name: TName,
    public _types: TTypes,
    private _relations: TRelations,
    public options: {
      omit?: SchemaOmit<TTypes, TRelations>;
      virtuals?: SchemaVirtuals<TTypes, TRelations, TVirtuals>;
      indexes?: SchemaIndexes<TTypes, TRelations>;
    },
  ) {}

  public static types<T extends AnySchema>(schema: T): InferSchemaTypes<T> {
    return schema._types;
  }

  public static relations<T extends AnySchema>(
    schema: T,
  ): InferSchemaRelations<T> {
    return schema._relations;
  }

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
    for (const [key, type] of Object.entries(Schema.types(this))) {
      const parser = MonarchType.parser(type);
      const parsed = parser(input[key as keyof InferSchemaInput<this>]);
      if (parsed === undefined || parsed === phantom) continue;
      data[key as keyof typeof data] = parsed;
    }
    // add and optionally override with relation types
    for (const [key, relation] of Object.entries(Schema.relations(this))) {
      const parser = MonarchType.parser(relation.type);
      const parsed = parser(input[key as keyof InferSchemaInput<this>]);
      if (parsed === undefined || parsed === phantom) continue;
      data[key as keyof typeof data] = parsed;
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
    for (const [key, type] of Object.entries(Schema.types(this))) {
      const updater = MonarchType.updater(type);
      if (updater) {
        updates[key as keyof InferSchemaOutput<this>] = updater();
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

  relations<T extends SchemaRelation<TTypes>>(
    fn: (relations: Relations<this>) => T,
  ) {
    const schema = this as unknown as Schema<
      TName,
      TTypes,
      Pretty<Merge<TRelations, T>>,
      SchemaOmit<TTypes, Merge<TRelations, T>>,
      TVirtuals
    >;
    schema._relations = {
      ...schema._relations,
      ...fn(relations(this)),
    };
    return schema;
  }
}

export function createSchema<
  TName extends string,
  TTypes extends Record<string, AnyMonarchType>,
>(name: TName, types: TTypes): Schema<TName, TTypes, {}, {}, {}> {
  return new Schema(name, types, {}, {});
}

export function makeIndexes<
  T extends Record<string, AnyMonarchType>,
  R extends Record<string, AnyMonarchRelation>,
>(indexesFn: SchemaIndexes<T, R>) {
  return indexesFn({
    createIndex: (fields, options) => [fields, options],
    unique: (field) => [{ [field as any]: 1 as const }, { unique: true }],
  });
}
