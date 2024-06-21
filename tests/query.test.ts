import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, describe, it } from "vitest";
import {
  array,
  createDatabase,
  createSchema,
  number,
  object,
  string,
} from "../src";

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
      abilities: object({
        speed: number(),
      }),
      tags: array(string()),
    });

    const { collections } = createDatabase(client, {
      users: UserSchema,
    });

    collections.users.aggregate().addStage({
      $match: {
        name: 1,
      },
    });

    collections.users.find().where({
      $or: [
        {
          name: 2,
        },
        {
          name: "",
        },
        {
          abilities: {
            speed: 10,
          },
        },
        // TODO: Implement DOT notation
        {
          "abilities.speed": "10",
        },
        {
          tags: "smo",
        },
      ],
    });

    collections.users.insertOne({
      name: 1,
    });
    collections.users.insertMany({
      name: 1,
    });

    collections.users.updateOne({
      name: 1,
    });
  });
});
