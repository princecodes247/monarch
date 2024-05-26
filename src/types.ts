import type { Infer, MonarchType } from "./schema-type";

export interface SchemaDefinition {
  [K: string]: MonarchType;
}

export type CreatedSchema<T extends SchemaDefinition> = {
  [K in keyof T]: Infer<T[K]> | null;
};
