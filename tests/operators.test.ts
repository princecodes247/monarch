import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { boolean, createDatabase, createSchema, number, string } from "../src";
import { and, eq, gt, gte, inArray, lt, lte, neq, nor, notInArray, or } from "../src/operators";
import { mockUsers } from "./mock";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
const client = new MongoClient(uri);


const UserSchema = createSchema("users", {
    name: string().optional(),
    email: string().lowercase().optional(),
    age: number().optional().default(10),
    isVerified: boolean().default(false),
});

const { collections, db } = createDatabase(client, {
    users: UserSchema,
});


describe("Query operators", () => {

    beforeAll(async () => {
        await client.connect();
    });

    afterEach(async () => {
        await collections.users.dropIndexes();
        await collections.users.deleteMany({}).exec();
    });

    afterAll(async () => {
        await client.close();
        await mongod.stop();
    });

    it("and operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            and({
                name: "anon",
            }, {
                age: 17
            })
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => user.name === "anon" && user.age === 17).length);
    });

    it("or operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            or({
                name: "anon",
            }, {
                name: "anon1"
            })
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => user.name === "anon" || user.name === "anon1").length);
    });

    it("nor operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            nor({
                name: "anon",
            }, {
                name: "anon1",
            })
        ).exec();

        expect(users.length).toBe(mockUsers.length - 2);
    });


    it("eq operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                name: eq("anon1")
            }
        ).exec();

        expect(users.length).toBe(1);
    });

    it("ne operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                name: neq("anon1")
            }
        ).exec();

        expect(users.length).toBe(mockUsers.length - 1);
    });

    it("gt operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                age: gt(17)
            }
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => user.age > 17).length);
    });

    it("gte operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                age: gte(17)
            }
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => user.age >= 17).length);
    });

    it("lt operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                age: lt(17)
            }
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => user.age < 17).length);
    });

    it("lte operator", async () => {
        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                age: lte(17)
            }
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => user.age <= 17).length);
    });


    it("in operator", async () => {

        const ageArray = [17]

        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                age: inArray(ageArray)
            }
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => ageArray.includes(user.age)).length);
    });

    it("nin operator", async () => {
        const ageArray = [17, 20, 25]

        await collections.users.insertMany().values(mockUsers).exec();
        const users = await collections.users.find().where(
            {
                age: notInArray([17, 20, 25])
                // age: 3
            }
        ).exec();

        expect(users.length).toBe(mockUsers.filter(user => !ageArray.includes(user.age)).length);
    });
});