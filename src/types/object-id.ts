import { MonarchParseError } from "../errors";
import { isValidObjectId, toObjectId } from "../utils";
import { MonarchType } from "./type";
import { ObjectId } from "./type-helpers";

export const objectId = () => {
    return new MonarchObjectId((input) => {
        if (typeof input === "string" && isValidObjectId(input)) return toObjectId(input);
        throw new MonarchParseError(`expected 'string' received '${typeof input}'`);
    });
};

export type ExtractObjectIds<T> = keyof {
    [K in keyof T as T[K] extends MonarchObjectId ? K : never]: T[K];
};
class MonarchObjectId extends MonarchType<string | ObjectId, ObjectId> { }
