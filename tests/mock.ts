import { generateObjectId } from "../src";

const firstUserId = generateObjectId()
export const mockUsers = [
    {
        _id: firstUserId,
        name: "anon",
        email: "anon@gmail.com",
        age: 17,
        isVerified: true,
    },
    {
        name: "anon1",
        email: "anon1@gmail.com",
        age: 20,
        isVerified: false,
    },
    {
        name: "anon2",
        email: "anon2@gmail.com",
        age: 25,
        isVerified: true,
    },
];


export const mockPosts = [
    {
        title: "First Post",
        message: "This is the message for the first post.",
        author: firstUserId,
    },
    {
        title: "Second Post",
        message: "This is the message for the second post.",
        author: firstUserId,
    },
    {
        title: "Third Post",
        message: "This is the message for the third post.",
        author: firstUserId,
    },
];
