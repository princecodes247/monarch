import * as dist from "./dist";
import {
  createClient,
  createDatabase,
  createSchema,
  createdAt,
  literal,
  string,
  updatedAt,
} from "./src";

const UserSchema = createSchema("users", {
  name: string(),
  email: string(),
  password: string(),
  accountType: literal("free", "paid"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
const { collections } = createDatabase(createClient("").db(), {
  users: UserSchema,
});
const user = collections.users.findOne({}).exec();

const UserSchemaDist = dist.createSchema("users", {
  name: dist.string(),
  email: dist.string(),
  password: dist.string(),
  accountType: dist.literal("free", "paid"),
  createdAt: dist.createdAt(),
  updatedAt: dist.updatedAt(),
});
const { collections: distCollections } = dist.createDatabase(
  dist.createClient("").db(),
  {
    users: UserSchemaDist,
  },
);
const userDist = distCollections.users.findOne({}).exec();

type Find<T extends dist.AnySchema> = FindOneQuery<
  T,
  WithProjection<
    "omit",
    IdFirst<
      Merge$1<
        WithRequiredId<
          Merge$1<
            InferTypeObjectOutput<T["_types"]>,
            InferRelationObjectOutput<InferSchemaRelations<T>>
          >
        >,
        InferVirtualOutput<InferSchemaVirtuals<T>>
      >
    > extends infer T_1
      ? {
          [K in keyof T_1]: IdFirst<
            Merge$1<
              WithRequiredId<
                Merge$1<
                  InferTypeObjectOutput<T["_types"]>,
                  InferRelationObjectOutput<InferSchemaRelations<T>>
                >
              >,
              InferVirtualOutput<InferSchemaVirtuals<T>>
            >
          >[K];
        }
      : never,
    InferSchemaOmit<T>
  >
>;

type Insert<T extends dist.AnySchema> = InsertOneQuery<
  T,
  WithProjection<
    "omit",
    IdFirst<
      Merge$1<
        WithRequiredId<
          Merge$1<
            InferTypeObjectOutput<T["_types"]>,
            InferRelationObjectOutput<InferSchemaRelations<T>>
          >
        >,
        InferVirtualOutput<InferSchemaVirtuals<T>>
      >
    > extends infer T_1
      ? {
          [K in keyof T_1]: IdFirst<
            Merge$1<
              WithRequiredId<
                Merge$1<
                  InferTypeObjectOutput<T["_types"]>,
                  InferRelationObjectOutput<InferSchemaRelations<T>>
                >
              >,
              InferVirtualOutput<InferSchemaVirtuals<T>>
            >
          >[K];
        }
      : never,
    InferSchemaOmit<T>
  >
>;
