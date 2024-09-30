import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boolean, createDatabase, createSchema, number, one, string } from "../src";
import { mockPosts, mockUsers } from "./mock";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
const client = new MongoClient(uri);


const UserSchema = createSchema("users", {
    name: string().optional(),
    email: string().lowercase().optional(),
    age: number().optional().default(10),
    isVerified: boolean().default(false),
});

const PostSchema = createSchema("posts", {
    title: string(),
    message: string(),
    author: one(UserSchema, "_id")
})

const { collections, db } = createDatabase(client, {
    users: UserSchema,
    posts: PostSchema
});


describe("Populate query", () => {

    beforeAll(async () => {
        await client.connect();
    });

    beforeEach(async () => {
        await collections.users.dropIndexes();
        await collections.users.deleteMany({}).exec();
    });

    afterEach(async () => {
        await collections.users.dropIndexes();
        await collections.users.deleteMany({}).exec();
    });

    afterAll(async () => {
        await client.close();
        await mongod.stop();
    });

    it("one ref", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        await collections.posts.insertMany().values(mockPosts).exec();
        const post = await collections.posts.findOne().exec();

        console.log({ user1: mockUsers[0], post })
        expect(post?.author).toBe(mockUsers[0]);
    });
});