import {
  createClient,
  createDatabase,
  createSchema,
  createdAt,
  literal,
  objectId,
  string,
  toObjectId,
  updatedAt,
} from "./dist";

const UserSchema = createSchema("users", {
  name: string(),
  email: string(),
  password: string(),
  accountType: literal("free", "paid"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const NoteSchema = createSchema("notes", {
  title: string(),
  content: string(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  userId: objectId(),
});

const client = createClient("");
const { collections, db } = createDatabase(client.db(), {
  users: UserSchema,
  notes: NoteSchema,
});

export const getUserById = async (id: string) => {
  const formattedId = toObjectId(id);
  if (!formattedId) throw new Error();

  const newUser = await collections.users
    .insertOne({
      _id: "",
      email: "",
      name: "",
      password: "",
      accountType: "free",
    })
    .exec();

  const oldUser = await collections.users
    .findOne({
      _id: "",
    })
    .exec();

  const user = await collections.users.findOne({ _id: formattedId }).exec();
  if (!user) throw new Error();

  return {
    _id: user._id,
    name: user.name,
    accountType: user.accountType,
  };
};
