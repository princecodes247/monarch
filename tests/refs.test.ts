import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  boolean,
  createDatabase,
  createSchema,
  date,
  objectId,
  string,
} from "../src";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();
const client = new MongoClient(uri);

describe("test for refs", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterEach(async () => {
    await client.db().dropDatabase();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it("populates one, many and ref", async () => {
    const _UserSchema = createSchema("users", {
      name: string(),
      isAdmin: boolean(),
      createdAt: date(),
      maybe: string().optional(),
    });
    const _PostSchema = createSchema("posts", {
      title: string(),
      contents: string(),
      author: objectId(),
    });

    const UserSchema = _UserSchema.relations(({ one, ref }) => ({
      tutor: one(_UserSchema, "_id").optional(),
      posts: ref(_PostSchema, "author", "_id"),
    }));
    const PostSchema = _PostSchema.relations(({ one, many }) => ({
      author: one(_UserSchema, "_id"),
      editor: one(_UserSchema, "_id"),
      contributors: many(_UserSchema, "_id"),
    }));

    const { collections } = createDatabase(client.db(), {
      users: UserSchema,
      posts: PostSchema,
    });

    // create user
    const user = await collections.users
      .insertOne({
        name: "Bob",
        isAdmin: false,
        createdAt: new Date(),
      })
      .exec();

    // create post and assign to user
    const post = await collections.posts
      .insertOne({
        title: "Pilot",
        contents: "Lorem",
        author: user._id,
        editor: user._id,
        contributors: [],
      })
      .exec();

    const populatedPost = await collections.posts
      .findOne({
        _id: post._id,
      })
      .populate({ author: true })
      .exec();
    expect(populatedPost?.editor).toStrictEqual(user._id);
    expect(populatedPost?.contributors).toStrictEqual([]);
    expect(populatedPost?.author).toStrictEqual(user);

    const populatedUser = await collections.users
      .findOne({
        _id: user._id,
      })
      .populate({ posts: true })
      .exec();
  });
});
