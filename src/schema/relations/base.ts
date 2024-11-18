import {
  MonarchNullable,
  MonarchOptional,
  MonarchType,
} from "../../types/type";
import type { InferRelationInput, InferRelationOutput } from "./type-helpers";

export type AnyMonarchRelation = MonarchRelation<any, any>;

export abstract class MonarchRelation<TInput, TOutput> {
  constructor(public type: MonarchType<TInput, TOutput>) {}

  public nullable() {
    return new MonarchNullableRelation(
      this.type as MonarchType<
        InferRelationInput<this>,
        InferRelationOutput<this>
      >,
    );
  }

  public optional() {
    return new MonarchOptionalRelation(
      this.type as MonarchType<
        InferRelationInput<this>,
        InferRelationOutput<this>
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
    type: MonarchType<InferRelationInput<T>, InferRelationOutput<T>>,
  ) {
    super(new MonarchNullable(MonarchType.parser(type)));
  }
}

export class MonarchOptionalRelation<
  T extends AnyMonarchRelation,
> extends MonarchRelation<
  InferRelationInput<T> | undefined,
  InferRelationOutput<T> | undefined
> {
  constructor(
    type: MonarchType<InferRelationInput<T>, InferRelationOutput<T>>,
  ) {
    super(new MonarchOptional(MonarchType.parser(type)));
  }
}
