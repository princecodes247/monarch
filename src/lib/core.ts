import type { Collection } from "mongodb";
import { MongoClient } from "mongodb";

class Database {
	private static _instance: Database;
	private client: MongoClient | null = null;
	private schemaNames: Set<string>;

	private constructor() {
		this.schemaNames = new Set<string>();
	}

	static getInstance(): Database {
		if (!Database._instance) {
			Database._instance = new Database();
		}
		return Database._instance;
	}

	isSchemaNameUnique(name: string): boolean {
		return !this.schemaNames.has(name);
	}

	addSchemaName(name: string): void {
		this.schemaNames.add(name);
	}

	async connect(connectionUri: string): Promise<void> {
		if (!this.client) {
			this.client = new MongoClient(connectionUri);
			await this.client.connect();
		}
	}

	getClient(): MongoClient {
		if (!this.client) {
			throw new Error("MongoDB client is not initialized");
		}
		return this.client;
	}
	getCollection(collectionName: string): Collection {
		if (!this.isSchemaNameUnique(collectionName)) {
			throw new Error(`Schema with name '${collectionName}' already exists.`);
		}
		if (!this.client) {
			throw new Error("MongoDB client is not initialized");
		}
		this.addSchemaName(collectionName);
		return this.client.db().collection(collectionName);
	}
}

const monarch = Database.getInstance();
export { Database, monarch };
