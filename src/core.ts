import type { Collection, MongoClient } from "mongodb";
import { QueryBuilder } from "./query-builder";
import type { Schema } from "./schema";
import type { SchemaDefinition } from "./types";

class Database<C extends Record<string, Schema<SchemaDefinition>>> {
  private static _instance: Database<Record<string, Schema<SchemaDefinition>>>;
  private _client: MongoClient | null = null;
  private schemaNames: Set<string> = new Set<string>();
  private collections: {
    [K in keyof C]: QueryBuilder<C[K]["schemaDefinition"]>;
  } = {} as any;

  private constructor(client: MongoClient, schemas: C) {
    this._client = client;
    for (const key in schemas) {
      if (Object.prototype.hasOwnProperty.call(schemas, key)) {
        const schema = schemas[key];
        this.collections[key] = new QueryBuilder(
          this.addCollection(schema.collectionName),
          schema.schemaDefinition
        );
      }
    }
  }

  isSchemaNameUnique(name: string): boolean {
    return !this.schemaNames.has(name);
  }

  addSchemaName(name: string): void {
    this.schemaNames.add(name);
  }

  setClient(client: MongoClient) {
    this._client = client;
  }

  getClient(): MongoClient {
    if (!this._client) {
      throw new Error("MongoDB _client is not initialized");
    }
    return this._client;
  }
  addCollection(collectionName: string): Collection {
    if (!this.isSchemaNameUnique(collectionName)) {
      throw new Error(`Schema with name '${collectionName}' already exists.`);
    }
    if (!this._client) {
      throw new Error("MongoDB _client is not initialized");
    }
    this.addSchemaName(collectionName);
    return this._client.db().collection(collectionName);
  }

  getCollection<K extends keyof C>(collectionName: K): Collection {
    if (!this._client) {
      throw new Error("MongoDB _client is not initialized");
    }
    return this._client.db().collection(collectionName as string);
  }

  static createDatabase<
    T extends Schema<SchemaDefinition>,
    C extends Record<string, T>
  >(client: MongoClient, schemas: C) {
    const database = new Database(client, schemas);
    return { db: database.collections };
  }
}

const createDatabase = Database.createDatabase;
export { createDatabase, Database };
