import { type MonarchType, type as monarchType } from "../types/type";
import type { InferRelationInput, InferRelationOutput } from "./type-helpers";

export abstract class MonarchRelation<TInput, TOutput> {
  constructor(public type: MonarchType<TInput, TOutput, any>) {}

  public nullable() {
    return new MonarchNullableRelation(
      this.type as MonarchType<
        InferRelationInput<this>,
        InferRelationOutput<this>,
        any
      >,
    );
  }

  public optional() {
    return new MonarchOptionalRelation(
      this.type as MonarchType<
        InferRelationInput<this>,
        InferRelationOutput<this>,
        any
      >,
    );
  }
}

export class MonarchNullableRelation<
  T extends AnyMonarchRelation,
> extends MonarchRelation<
  InferRelationInput<T> | null,
  InferRelationOutput<T> | null
> {
  constructor(
    type: MonarchType<InferRelationInput<T>, InferRelationOutput<T>, any>,
  ) {
    super(
      monarchType((input) => {
        if (input === null) return null;
        return type._parser(input);
      }),
    );
  }
}

export class MonarchOptionalRelation<
  T extends AnyMonarchRelation,
> extends MonarchRelation<
  InferRelationInput<T> | undefined,
  InferRelationOutput<T> | undefined
> {
  constructor(
    type: MonarchType<InferRelationInput<T>, InferRelationOutput<T>, any>,
  ) {
    super(
      monarchType((input) => {
        if (input === undefined) return undefined;
        return type._parser(input);
      }),
    );
  }
}

export type AnyMonarchRelation = MonarchRelation<any, any>;
