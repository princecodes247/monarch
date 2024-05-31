import { MongoClient } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { createDatabase, createSchema, literal, string } from "../src";

import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();
const client = new MongoClient(uri);

enum Test {
  GOOD = "good",
  BAD = "bad",
  UGLY = "ugly",
}

describe("test for boolean, number and string", () => {
  beforeAll(async () => {
    await client.connect();
  });

  it("inserts and finds", async () => {
    const StudentScoreSchema = createSchema("students", {
      name: string().nullable(),
      grade: literal("A", "B", "C"),
    });

    const { collections } = createDatabase(client, {
      students: StudentScoreSchema,
    });

    const newStudent = await collections.students
      .insert({
        name: "anon",
        grade: "A",
      })
      .exec();
    expect(newStudent).not.toBe(null);
    expect(newStudent).toStrictEqual(
      expect.objectContaining({
        name: "anon",
        grade: "A",
      })
    );

    const students = await collections.students.find().where({}).exec();
    expect(students.length).toBeGreaterThanOrEqual(1);

    const existingUser = students[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "anon",
        grade: "A",
      })
    );
  });
});
