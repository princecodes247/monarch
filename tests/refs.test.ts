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
      author: objectId(),
      // contributors: array(objectId())
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
    // Create database collections
    return createDatabase(client.db(), {
      users: UserSchema,
      posts: PostSchema,
    });
  };

  it("should populate 'author' and contributors in findOne", async () => {
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
      .populate({ author: true, contributors: true, editor: true })
      .exec();
    // console.log({populatedPost})

    expect(populatedPost?.author).toStrictEqual(user);
    // expect(populatedPost?.contributors[0]?.name).toStrictEqual(user2.name);
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

    // Fetch and populate posts for all users using find
    const populatedUsers = await collections.users
      .find()
      .populate({ posts: true, tutor: true })
      .exec();

    const populatedPosts = await collections.posts
      .find()
      .populate({ contributors: true })
      .exec();

    expect(populatedUsers.length).toBe(2);
    // expect(populatedUsers[0].posts.length).toBe(2);
    // expect(populatedUsers[1].posts.length).toBe(0);
    // expect(populatedUsers[1].tutor).toStrictEqual(user);
  });
});
