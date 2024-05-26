import { createSchema, monarch, number, string } from "../lib";

monarch.connect("mongodb://localhost:27017/test-monarch");

const UserSchema = createSchema("users", {
	name: string().nullable(),
	email: string().optional().lowercase(),
	age: number().optional().default(10),
});

async function testFind() {
	const users = await UserSchema.find()
		.where({ age: { $lte: 18 } })
		.select({
			age: 1,
			_id: 0,
		})
		.limit(1)
		.exec();

	console.log({ users });
}

testFind();
