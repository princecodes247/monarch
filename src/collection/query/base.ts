import type { Collection as MongoCollection } from "mongodb";
import type { AnySchema } from "../../schema/schema";
import type { InferSchemaData } from "../../schema/type-helpers";

export abstract class Query<T extends AnySchema, O> {
  constructor(
    protected _schema: T,
    protected _collection: MongoCollection<InferSchemaData<T>>,
    protected _readyPromise: Promise<void>,
  ) {}

  public abstract exec(): Promise<O>;

  // biome-ignore lint/suspicious/noThenProperty: We need automatic promise resolution
  then<TResult1 = O, TResult2 = never>(
    onfulfilled?:
      | ((value: O) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<O | TResult> {
    return this.exec().catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<O> {
    return this.exec().finally(onfinally);
  }
}
