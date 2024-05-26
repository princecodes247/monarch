import { beforeAll, describe, expect, it } from "vitest";
import { boolean, createSchema, monarch, number, string } from "../src";

describe("test for boolean, number and string", () => {
  beforeAll(() => {
    monarch.connect("mongodb://localhost:27017/monarch-test");
  });

  it("inserts and finds", async () => {
    const UserSchema = createSchema("users", {
      name: string().nullable(),
      email: string().optional().lowercase(),
      age: number().optional().default(10),
      isVerified: boolean(),
    });

    const newUser = await UserSchema.insert({
      email: "anon@gmail.com",
      name: "anon",
      age: 0,
      isVerified: true,
    });
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        email: "anon@gmail.com",
        name: "anon",
        age: 0,
        isVerified: true,
      })
    );

    const users = await UserSchema.find().where({ isVerified: true }).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        email: "anon@gmail.com",
        name: "anon",
        age: 0,
        isVerified: true,
      })
    );
  });
});
