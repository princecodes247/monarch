import type { Parser } from "../../types/type";
import type { InferRelationInput, InferRelationOutput } from "./type-helpers";

export type AnyMonarchRelation = MonarchRelation<any, any>;

export abstract class MonarchRelation<TInput, TOutput> {
  constructor(public parser: Parser<TInput, TOutput>) {}

  public static isInstanceOf<T extends AnyMonarchRelation>(
    type: T,
    target: new (...args: any[]) => any,
  ) {
    return type.isInstanceOf(target);
  }

  protected isInstanceOf(target: new (...args: any[]) => any) {
    return this instanceof target;
  }

  public nullable() {
    return new MonarchNullableRelation(this);
  }

  public optional() {
    return new MonarchOptionalRelation(this);
  }
}

abstract class BaseWrappedRelation<
  T extends AnyMonarchRelation,
> extends MonarchRelation<
  InferRelationInput<T> | undefined,
  InferRelationOutput<T> | undefined
> {
  constructor(
    protected type: T,
    parser: Parser<any, any>,
  ) {
    super(parser);
  }

  protected isInstanceOf(target: new (...args: any[]) => any) {
    return (
      this instanceof target ||
      (this.type != null && MonarchRelation.isInstanceOf(this.type, target))
    );
  }
}

export class MonarchNullableRelation<
  T extends AnyMonarchRelation,
> extends BaseWrappedRelation<T> {
  constructor(type: T) {
    super(type, (input) => {
      if (input === null) return null;
      return type.parser(input);
    });
    this.type = type;
  }
}

export class MonarchOptionalRelation<
  T extends AnyMonarchRelation,
> extends BaseWrappedRelation<T> {
  constructor(type: T) {
    super(type, (input) => {
      if (input === undefined) return undefined;
      return type.parser(input);
    });
    this.type = type;
  }
}
