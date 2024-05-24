import type { Collection } from "mongodb";
import { MongoClient } from "mongodb";

class Database {
	private static _instance: Database;
	private client: MongoClient | null = null;

	private constructor() {}

	static getInstance(): Database {
		if (!Database._instance) {
			Database._instance = new Database();
		}
		return Database._instance;
	}

	async connect(): Promise<void> {
		if (!this.client) {
			this.client = new MongoClient("mongodb://localhost:27017/test-monarch");
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
		if (!this.client) {
			throw new Error("MongoDB client is not initialized");
		}
		return this.client.db().collection(collectionName);
	}
}

const monarch = Database.getInstance();
export { Database, monarch };
