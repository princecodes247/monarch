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

export class MonarchNullableRelation<
  T extends AnyMonarchRelation,
> extends MonarchRelation<
  InferRelationInput<T> | null,
  InferRelationOutput<T> | null
> {
  constructor(private type: T) {
    super((input) => {
      if (input === null) return null;
      return type.parser(input);
    });
  }

  protected isInstanceOf(target: new (...args: any[]) => any) {
    return (
      this instanceof target || MonarchRelation.isInstanceOf(this.type, target)
    );
  }
}

export class MonarchOptionalRelation<
  T extends AnyMonarchRelation,
> extends MonarchRelation<
  InferRelationInput<T> | undefined,
  InferRelationOutput<T> | undefined
> {
  constructor(private type: T) {
    super((input) => {
      if (input === undefined) return undefined;
      return type.parser(input);
    });
  }

  protected isInstanceOf(target: new (...args: any[]) => any) {
    return (
      this instanceof target || MonarchRelation.isInstanceOf(this.type, target)
    );
  }
}
