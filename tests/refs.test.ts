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
    });
    const _PostSchema = createSchema("posts", {
      title: string(),
      contents: string(),
      author: objectId(),
    });

    const UserSchema = _UserSchema.withRelations(({ one, ref }) => ({
      tutor: one(_UserSchema, { field: "_id" }).nullable(),
      posts: ref(_PostSchema, {
        field: "author",
        references: "_id",
      }),
    }));
    const PostSchema = _PostSchema.withRelations(({ one, many }) => ({
      author: one(_UserSchema, { field: "_id" }),
      contributors: many(_UserSchema, { field: "_id" }),
    }));

    const { collections } = createDatabase(client.db(), {
      users: UserSchema,
      posts: PostSchema,
    });

    // create user
    const user = await collections.users
      .insert()
      .values({
        name: "Bob",
        isAdmin: false,
        createdAt: new Date(),
        tutor: null,
      })
      .exec();

    // ref property should not exist until populated
    expect(user).not.toHaveProperty("posts");

    // create post and assign to user
    const post = await collections.posts
      .insert()
      .values({
        title: "Pilot",
        contents: "Lorem",
        author: user._id,
        contributors: [],
      })
      .exec();
    expect(post.author).toStrictEqual(user._id);

    const populatedPost = await collections.posts
      .findOne()
      .where({
        _id: post._id,
      })
      .populate({ author: true })
      .exec();
    expect(populatedPost?.author).toStrictEqual(user);
    const populatedUser = await collections.users
      .findOne()
      .where({
        _id: user._id,
      })
      .populate({ posts: true })
      .exec();
  });
});
