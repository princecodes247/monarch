import { MongoClient } from "mongodb";
import { MonarchError } from "./errors";
import { QueryBuilder } from "./query-builder";
import { Schema } from "./schema";

type DbQueryBuilder = <T extends Schema<any, any>>(
  schema: T
) => QueryBuilder<T>;
type CollectionsQueryBuilder<T extends Record<string, Schema<any, any>>> = {
  [K in keyof T]: QueryBuilder<T[K]>;
};

type Database<T extends Record<string, Schema<any, any>>> = {
  db: DbQueryBuilder;
  collections: CollectionsQueryBuilder<T>;
};

export function createDatabase<T extends Record<string, Schema<any, any>>>(
  client: MongoClient,
  schemas: T
): Database<T> {
  const collections = {} as { [K in keyof T]: QueryBuilder<T[K]> };
  const collectionNames = new Set<string>();

  for (const [key, schema] of Object.entries(schemas)) {
    if (collectionNames.has(schema.name)) {
      throw new MonarchError(
        `Schema with name '${schema.name}' already exists.`
      );
    }
    collectionNames.add(schema.name);

    collections[key as keyof T] = new QueryBuilder(
      client,
      schema as T[keyof T]
    );
  }

  return {
    db: (schema) => new QueryBuilder(client, schema),
    collections,
  };
}
