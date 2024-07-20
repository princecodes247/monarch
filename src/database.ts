import { MongoClient, MongoClientOptions } from "mongodb";
import { Collection } from "./collection";
import { MonarchError } from "./errors";
import { AnySchema } from "./schema/schema";

type DbCollectionManager = <T extends AnySchema>(schema: T) => Collection<T>;
type Collections<T extends Record<string, AnySchema>> = {
  [K in keyof T]: Collection<T[K]>;
};

type Database<T extends Record<string, AnySchema>> = {
  db: DbCollectionManager;
  collections: Collections<T>;
};

export function createDatabase<T extends Record<string, AnySchema>>(
  client: MongoClient,
  schemas: T
): Database<T> {
  const collections = {} as { [K in keyof T]: Collection<T[K]> };
  const collectionNames = new Set<string>();

  for (const [key, schema] of Object.entries(schemas)) {
    if (collectionNames.has(schema.name)) {
      throw new MonarchError(
        `Schema with name '${schema.name}' already exists.`
      );
    }
    collectionNames.add(schema.name);

    collections[key as keyof T] = new Collection(
      client,
      schema as T[keyof T]
    );
  }

  // TODO: Implement additional methods like   listCollections() 

  return {
    db: (schema) => new Collection(client, schema),
    collections,
  };
}

export function createClient(uri: string, options?: MongoClientOptions) {
  const client = new MongoClient(uri, options);
  return client;
}
