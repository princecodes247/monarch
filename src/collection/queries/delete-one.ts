import type {
    DeleteOptions,
    DeleteResult
} from "mongodb";
import { AnySchema } from "../../schema/schema";
import { BaseFindQuery } from "./base";


export class DeleteOneQuery<T extends AnySchema> extends BaseFindQuery<T> {
    protected _options: DeleteOptions = {};

    options(options: DeleteOptions): this {
        this._options = { ...this._options, ...options };
        return this;
    }

    async exec(): Promise<DeleteResult> {
        const result = await this._collection.deleteOne(
            this.filters,
            this._options
        );
        return result;
    }
}