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
  virtual,
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
      secret: string().default(() => "secret"),
    })
      .omit({ secret: true })
      .virtuals({
        contributorsCount: virtual(
          "contributors",
          ({ contributors }) => contributors?.length ?? 0,
        ),
        secretSize: virtual("secret", ({ secret }) => secret.length),
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

  it("should populate relation", async () => {
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
        tutor: user._id,
        createdAt: new Date(),
      })
      .exec();

    const populatedUser2 = await collections.users
      .findById(user2._id)
      .populate({ tutor: true })
      .exec();

    expect(populatedUser2).toStrictEqual({
      ...user2,
      tutor: user,
    });
  });

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
        .populate({ posts: { limit: 1, skip: 0 } })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0].title).toBe("Post 1");
    });

    it("should populate with default omit option", async () => {
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
          posts: true,
        })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0]).toHaveProperty("contents");
      expect(populatedUser[0].posts[0]).not.toHaveProperty("secret");
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
          posts: {
            omit: { title: true },
          },
        })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0]).toHaveProperty("secret");
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
          posts: {
            select: { title: true },
          },
        })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(1);
      expect(populatedUser[0].posts[0]).toHaveProperty("title");
      expect(populatedUser[0].posts[0]).not.toHaveProperty("contents");
      expect(populatedUser[0].posts[0]).not.toHaveProperty("secret");
    });

    it("should populate with sort option", async () => {
      const { collections } = setupSchemasAndCollections();
      // Create a user and posts
      const user = await collections.users
        .insertOne({
          name: "Test User 5",
          isAdmin: false,
          createdAt: new Date(),
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 6",
          contents: "Content 6",
          author: user._id,
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 7",
          contents: "Content 7",
          author: user._id,
        })
        .exec();

      // Fetch and populate posts with sort option
      const populatedUser = await collections.users
        .find()
        .populate({
          posts: {
            sort: { title: -1 },
          },
        })
        .exec();

      expect(populatedUser.length).toBe(1);
      expect(populatedUser[0].posts.length).toBe(2);
      expect(populatedUser[0].posts[0]).toHaveProperty("title", "Post 7");
      expect(populatedUser[0].posts[1]).toHaveProperty("title", "Post 6");
    });

    it("should access original population fields in virtuals", async () => {
      const { collections } = setupSchemasAndCollections();
      // Create a user and posts
      const user1 = await collections.users
        .insertOne({
          name: "Test User 1",
          isAdmin: false,
          createdAt: new Date(),
        })
        .exec();

      const user2 = await collections.users
        .insertOne({
          name: "Test User 2",
          isAdmin: false,
          createdAt: new Date(),
        })
        .exec();

      await collections.posts
        .insertOne({
          title: "Post 6",
          contents: "Content 6",
          contributors: [user1._id, user2._id],
          secret: "12345",
        })
        .exec();

      // Fetch and populate posts with sort option
      const populatedPost = await collections.posts
        .find()
        .populate({
          contributors: {
            select: { name: true },
          },
        })
        .exec();

      expect(populatedPost.length).toBe(1);
      expect(populatedPost[0].contributorsCount).toBe(2);
      expect(populatedPost[0].contributors.length).toBe(2);
      expect(populatedPost[0].contributors[0]).toStrictEqual({
        _id: user1._id,
        name: user1.name,
      });
      expect(populatedPost[0].contributors[1]).toStrictEqual({
        _id: user2._id,
        name: user2.name,
      });
      expect(populatedPost[0].secretSize).toBe(5);
      // should remove extra inputs for virtuals
      expect(populatedPost[0]).not.toHaveProperty("secret");
    });
  });
});
