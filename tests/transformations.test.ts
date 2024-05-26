import { beforeAll, describe, expect, it } from "vitest";
import { createSchema, monarch, string } from "../src";

describe("test for transformations", () => {
  beforeAll(() => {
    monarch.connect("mongodb://localhost:27017/monarch-test");
  });

  it("returns value in lowercase", async () => {
    const UserSchema = createSchema("users", {
      name: string().lowercase(),
    });
    const newUser = await UserSchema.insert({
      name: "PRINCE",
    });
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        name: "prince",
      })
    );

    const users = await UserSchema.find().where({ _id: newUser?._id }).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "prince",
      })
    );
  });

  it("returns value in uppercase", async () => {
    const UserSchema = createSchema("userUpper", {
      name: string().uppercase(),
    });
    const newUser = await UserSchema.insert({
      name: "EriiC",
    });
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        name: "ERIIC",
      })
    );

    const users = await UserSchema.find().where({ _id: newUser?._id }).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "ERIIC",
      })
    );
  });

  it("returns value with '-go' at the end", async () => {
    const UserSchema = createSchema("userWithGo", {
      name: string().addTransformation((value) => `${value}-go`),
    });
    const newUser = await UserSchema.insert({
      name: "mon",
    });
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        name: "mon-go",
      })
    );

    const users = await UserSchema.find().where({ _id: newUser?._id }).exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        name: "mon-go",
      })
    );
  });
});
