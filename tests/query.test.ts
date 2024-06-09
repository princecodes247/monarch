import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, describe, it } from "vitest";
import { createDatabase, createSchema, string } from "../src";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();
const client = new MongoClient(uri);

describe("test for date", () => {
  beforeAll(async () => {
    await client.connect();
  });

  it("insert's date object and find's it", async () => {
    const UserSchema = createSchema("users", {
      name: string(),
    });

    const { collections } = createDatabase(client, {
      users: UserSchema,
    });

    collections.users.aggregate().addStage({
      $addFields: {
        test: {
          sdfo: "sd",
          $sum: { $multiply: ["$qty", 3] },
        },
      },
      $count: "cnt",
    });
  });
});
