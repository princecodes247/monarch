import { createSchema, monarch, number, string } from "../lib";

monarch.connect();

const UserSchema = createSchema("users", {
	name: string().nullable(),
	email: string().optional(),
	age: number().optional().default(10),
});

async function testStuff() {
	// Create a new user
	// @ts-ignore
	const newUser = await UserSchema.insert({
		// email: "80",
		name: null,
	});
	console.log("Created user:", newUser);
}

testStuff();
// Define the model

// Usage example
// async function main() {
// 	// Create a new user
// 	const newUser = await UserModel.create({
// 		name: "John Doe",
// 		email: "john@example.com",
// 		age: 30,
// 	});
// 	console.log("Created user:", newUser);

// 	// Fetch user by email
// 	const fetchedUser = await UserModel.findOne({ email: "john@example.com" });
// 	console.log("Fetched user:", fetchedUser);

// 	// Update user
// 	if (fetchedUser) {
// 		const updatedUser = await UserModel.updateOne(
// 			{ email: "john@example.com" },
// 			{ age: 31 },
// 		);
// 		console.log("Updated user:", updatedUser);
// 	}

// 	// Delete user
// 	if (fetchedUser) {
// 		const deletionResult = await UserModel.deleteOne({
// 			email: "john@example.com",
// 		});
// 		console.log("User deleted:", deletionResult);
// 	}
// }

// main().catch(console.error);
