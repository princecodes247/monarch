import { createSchema, monarch, number, string } from "../lib";

monarch.connect();

const UserSchema = createSchema("users", {
	name: string(),
	email: string(),
	age: number().default(0),
});

async function testStuff() {
	// Create a new user
	const newUser = await UserSchema.insert({
		email: "80",
		age: 90,
		name: "kp",
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
