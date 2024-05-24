import { UserModel } from ".";

const newUser = UserModel.create({
	email: "80",
	age: 90,
	name: "",
});
console.log("Created user:", newUser);
