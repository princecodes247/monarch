import { MongoClient, MongoClientOptions } from "mongodb";
import { MonarchError } from "./errors";
import { QueryBuilder } from "./queries/query-builder";
import { AnySchema } from "./schema";

type DbQueryBuilder = <T extends AnySchema>(schema: T) => QueryBuilder<T>;
type CollectionsQueryBuilder<T extends Record<string, AnySchema>> = {
  [K in keyof T]: QueryBuilder<T[K]>;
};

type Database<T extends Record<string, AnySchema>> = {
  db: DbQueryBuilder;
  collections: CollectionsQueryBuilder<T>;
};

export function createDatabase<T extends Record<string, AnySchema>>(
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

export function createClient(uri: string, options?: MongoClientOptions) {
  const client = new MongoClient(uri, options);
  return client;
}
