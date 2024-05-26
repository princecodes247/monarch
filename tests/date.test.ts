import { beforeAll, describe, expect, it } from "vitest";
import { createSchema, date, monarch } from "../src";

describe("test for date", () => {
  beforeAll(() => {
    monarch.connect("mongodb://localhost:27017/monarch-test");
  });

  it("inserts and finds", async () => {
    const UserSchema = createSchema("users", {
      currentDate: date(),
    });
    const markedDate = new Date();
    const newUser = await UserSchema.insert({
      currentDate: markedDate,
    });
    expect(newUser).not.toBe(null);
    expect(newUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate,
      })
    );

    const users = await UserSchema.find()
      .where({ currentDate: markedDate })
      .exec();
    expect(users.length).toBeGreaterThanOrEqual(1);

    const existingUser = users[0];
    expect(existingUser).toStrictEqual(
      expect.objectContaining({
        currentDate: markedDate,
      })
    );
  });
});
