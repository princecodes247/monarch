import { beforeAll, describe, expect, it } from "vitest";
import { createSchema, monarch, number, string } from "../src";

describe("Monarch API", () => {
  beforeAll(() => {
    monarch.connect("mongodb://localhost:27017/monarch-test");
  });

  it("inserts and finds", async () => {
    const UserSchema = createSchema("users", {
      name: string().nullable(),
      email: string().optional().lowercase(),
      age: number().optional().default(10),
    });

    const newUser = await UserSchema.insert({
      email: "anon@gmail.com",
      name: "anon",
      age: 0,
    });

    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual({
      email: "anon@gmail.com",
      name: "anon",
      age: 0,
    });

    const users = await UserSchema.find()
      .where({ age: { $lte: 18 } })
      .select({
        age: 1,
        _id: 0,
      })
      .limit(1)
      .exec();

    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual({
      email: "anon@gmail.com",
      name: "anon",
      age: 0,
    });
  });
});
