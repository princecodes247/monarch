import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  array,
  boolean,
  createDatabase,
  createSchema,
  date,
  objectId,
  string,
} from "../src";

let mongod: MongoMemoryServer;
let client: MongoClient;
let uri: string;

describe("Tests for refs population", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
  });

  afterEach(async () => {
    // Drop the database after each test to ensure isolation
    await client.db().dropDatabase();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  const setupSchemasAndCollections = () => {
    // Define schemas
    const _UserSchema = createSchema("users", {
      name: string(),
      isAdmin: boolean(),
      createdAt: date(),
      tutor: objectId().optional(),
      maybe: string().optional(),
    });
    const _PostSchema = createSchema("posts", {
      title: string(),
      contents: string(),
      author: objectId().optional(),
      contributors: array(objectId()).optional().default([]),
    });

    const UserSchema = _UserSchema.relations(({ one, ref }) => ({
      tutor: one(_UserSchema, "_id").optional(),
      posts: ref(_PostSchema, "author", "_id"),
    }));
    const PostSchema = _PostSchema.relations(({ one, many }) => ({
      author: one(_UserSchema, "_id").optional().nullable(),
      editor: one(_UserSchema, "_id").optional().nullable(),
      contributors: many(_UserSchema, "_id").optional(),
    }));
    // Create database collections
    return createDatabase(client.db(), {
      users: UserSchema,
      posts: PostSchema,
    });
  };

  it("should populate 'author' and 'contributors' in findOne", async () => {
    const { collections } = setupSchemasAndCollections();

    const user = await collections.users
      .insertOne({
        name: "Bob",
        isAdmin: false,
        createdAt: new Date(),
      })
      .exec();

    const user2 = await collections.users
      .insertOne({
        name: "Alex",
        isAdmin: false,
        createdAt: new Date(),
      })
      .exec();

    await collections.posts
      .insertOne({
        title: "Pilot",
        contents: "Lorem",
        author: user._id,
        editor: user._id,
        contributors: [user2._id],
      })
      .exec();

    // Fetch and populate post's author using findOne
    const populatedPost = await collections.posts
      .findOne({
        title: "Pilot",
      })
      .populate({ contributors: true, author: true })
      .exec();

    expect(populatedPost?.author).toStrictEqual(user);
    expect(populatedPost?.contributors).toBeDefined();
    expect(populatedPost?.contributors).toHaveLength(1);
    expect(populatedPost?.contributors[0]).toStrictEqual(user2);
  });

  it("should populate 'posts' in find for multiple users", async () => {
    const { collections } = setupSchemasAndCollections();

    // Create users
    const user = await collections.users
      .insertOne({
        name: "Bob",
        isAdmin: false,
        createdAt: new Date(),
        tutor: undefined,
      })
      .exec();

    const tutoredUser = await collections.users
      .insertOne({
        name: "Alexa",
        isAdmin: false,
        createdAt: new Date(),
        tutor: user._id,
      })
      .exec();

    // Create posts and assign to users
    await collections.posts
      .insertOne({
        title: "Pilot",
        contents: "Lorem",
        author: user._id,
        editor: user._id,
        contributors: [tutoredUser._id],
      })
      .exec();

    await collections.posts
      .insertOne({
        title: "Pilot 2",
        contents: "Lorem2",
        author: user._id,
        editor: user._id,
        contributors: [],
      })
      .exec();

    // Test case for optional author
    await collections.posts
      .insertOne({
        title: "No Author",
        contents: "Lorem",
        editor: user._id,
        contributors: [],
      })
      .exec();

    // Fetch and populate posts for all users using find
    const populatedUsers = await collections.users
      .find()
      .populate({ posts: true, tutor: true })
      .exec();

    expect(populatedUsers.length).toBe(2);
    expect(populatedUsers[0].posts.length).toBe(2);
    expect(populatedUsers[1].posts.length).toBe(0);
    expect(populatedUsers[1].tutor).toStrictEqual(user);
  });

  describe("Monarch Population Options", () => {
    it("should populate with limit and skip options", async () => {
      const { collections } = setupSchemasAndCollections();

      // Create a user and posts
      const user = await collections.users
        .insertOne({
          name: "Test User",
          isAdmin: false,
          createdAt: new Date(),
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 1",
          contents: "Content 1",
          author: user._id,
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 2",
          contents: "Content 2",
          author: user._id,
        })
        .exec();

      // Fetch and populate posts with limit and skip
      const populatedUser = await collections.users
        .find()
        //@ts-expect-error -- Fix types
        .populate({ posts: { limit: 1, skip: 0 } })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0].title).toBe("Post 1");
    });

    it("should populate with omit option", async () => {
      const { collections } = setupSchemasAndCollections();
      // Create a user and posts
      const user = await collections.users
        .insertOne({
          name: "Test User 2",
          isAdmin: false,
          createdAt: new Date(),
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 3",
          contents: "Content 3",
          author: user._id,
        })
        .exec();

      // Fetch and populate posts with select and omit options
      const populatedUser = await collections.users
        .find()
        .populate({
          //@ts-expect-error -- Fix types
          posts: {
            omit: { title: 1 },
          },
        })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0]).toHaveProperty("contents");
      expect(populatedUser[0].posts[0]).not.toHaveProperty("title");
    });

    it("should populate with select option", async () => {
      const { collections } = setupSchemasAndCollections();
      // Create a user and posts
      const user = await collections.users
        .insertOne({
          name: "Test User 2",
          isAdmin: false,
          createdAt: new Date(),
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 3",
          contents: "Content 3",
          author: user._id,
        })
        .exec();

      // Fetch and populate posts with select and omit options
      const populatedUser = await collections.users
        .find()
        .populate({
          //@ts-expect-error -- Fix types
          posts: {
            select: { title: 1 },
          },
        })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0]).toHaveProperty("title");
      expect(populatedUser[0].posts[0]).not.toHaveProperty("contents");
    });
  });
});
