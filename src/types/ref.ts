import { MonarchParseError } from "../errors";
import { AnySchema } from "../schema/schema";
import { WithOptionalId } from "../type-helpers";
import { isValidObjectId, toObjectId } from "../utils";
import { ExtractObjectIds } from "./object-id";
import { MonarchType, Parser } from "./type";
import { ObjectId } from "./type-helpers";

export type IsReference<T> = T extends MonarchReference<any> ? true : false;

export type ExtractReferences<T extends AnySchema> = {
    [K in keyof T]: IsReference<T[K]> extends true ? K : never;
}[keyof T];


// type MonarchRefInput = (string | ObjectId) | (string | ObjectId)[]
// type MonarchRefOutput = ObjectId | ObjectId[]
type MonarchRefInput = string | ObjectId
type MonarchRefOutput<T extends AnySchema> = ObjectId | T

// Base reference class
export class MonarchReference<T extends AnySchema> extends MonarchType<MonarchRefInput, MonarchRefOutput<T>> {
    constructor(public foreignSchema: T, public field: string, public _parser: Parser<MonarchRefInput, MonarchRefOutput<T>>) {
        super(_parser)
    }
}

// 'one' function for single reference
export function one<T extends AnySchema>(schema: T, field: ExtractObjectIds<T["types"]> | keyof WithOptionalId<{}>) {
    return new MonarchReference(schema, field.toString(), (input) => {
        if (!Array.isArray(input) && isValidObjectId(input)) return toObjectId(input);
        throw new MonarchParseError(`expected 'objectId' received '${typeof input}'`);
    });
}

// // 'many' function for multiple references (array)
// export function many(schema: AnySchema, field: string) {
//     return new MonarchReference(schema, field, (input) => {
//         if (Array.isArray(input)) {
//             const parsed = [] as InferTypeOutput<MonarchType<ObjectId>>[];
//             for (const [index, value] of input.entries()) {
//                 try {
//                     const parsedValue = toObjectId(value);
//                     if (typeof value === "string" && isValidObjectId(parsedValue ?? "")) {
//                         parsed[index] = parsedValue;
//                     } else {

//                         throw new MonarchParseError(`expected 'objectId' received '${typeof input}'`);
//                     }
//                 } catch (error) {
//                     if (error instanceof MonarchParseError) {
//                         throw new MonarchParseError(
//                             `element at index '${index}' ${error.message}'`
//                         );
//                     }
//                     throw error;
//                 }
//             }
//             return parsed;
//         }
//         throw new MonarchParseError(`expected 'array' received '${typeof input}'`);
//     });
// }

// 'ref' function for foreign references
export class MonarchForeignReference {
    constructor(
        public schema: AnySchema,
        public options: { foreignField: string; references: string }
    ) { }
}

export function ref(schema: AnySchema, options: { foreignField: string; references: string }) {
    return new MonarchForeignReference(schema, options);
}
