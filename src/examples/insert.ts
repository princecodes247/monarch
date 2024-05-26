import { createSchema, monarch, number, string } from "../lib";

monarch.connect("mongodb://localhost:27017/test-monarch");

const UserSchema = createSchema("users", {
	name: string().nullable(),
	email: string().optional().lowercase(),
	age: number().optional().default(10),
});

async function testInsert() {
	// Create a new user
	const newUser = await UserSchema.insert({
		email: "GHOGHO",
		name: "null",
		age: 0,
	});
	console.log("Created user:", newUser);
}

testInsert();
