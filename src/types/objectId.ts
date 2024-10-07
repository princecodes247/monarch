import { ObjectId } from "mongodb";
import { MonarchParseError } from "../errors";
import { MonarchType, Scopes } from "./type";

export const objectId = () => new MonarchObjectId();

export class MonarchObjectId extends MonarchType<
  ObjectId,
  ObjectId,
  typeof Scopes.Default
> {
  constructor() {
    super((input) => {
      if (input instanceof ObjectId) return input;
      throw new MonarchParseError(
        `expected 'ObjectId' received '${typeof input}'`,
      );
    }, Scopes.Default);
  }
}

export const objectIdString = () => new MonarchObjectId();

export class MonarchObjectIdString extends MonarchType<
  string,
  ObjectId,
  typeof Scopes.Default
> {
  constructor() {
    super((input) => {
      if (ObjectId.isValid(input)) return new ObjectId(input);
      throw new MonarchParseError(
        `expected valid ObjectId hex string received '${input}'`,
      );
    }, Scopes.Default);
  }
}
