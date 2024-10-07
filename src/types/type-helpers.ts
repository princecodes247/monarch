import type { Pretty } from "../type-helpers";
import type { AnyMonarchType, MonarchPhantom, MonarchType } from "./type";

export type InferTypeInput<T> = T extends MonarchType<infer U, any, any>
  ? U
  : never;
export type InferTypeOutput<T> = T extends MonarchType<any, infer U, any>
  ? U
  : never;

export type InferTypeObjectInput<T extends Record<string, AnyMonarchType>> =
  Pretty<
    {
      [K in keyof T as undefined extends InferTypeInput<T[K]>
        ? never
        : K]: InferTypeInput<T[K]>; // required keys
    } & {
      [K in keyof T as undefined extends InferTypeInput<T[K]>
        ? T[K] extends MonarchPhantom<{ input: true; output: any }, any>
          ? never
          : K
        : never]?: InferTypeInput<T[K]>; // optional keys
    }
  >;
export type InferTypeObjectOutput<T extends Record<string, AnyMonarchType>> =
  Pretty<{
    [K in keyof T as T[K] extends MonarchPhantom<
      { input: any; output: true },
      any
    >
      ? never
      : K]: InferTypeOutput<T[K]>;
  }>;

export type InferTypeTupleInput<
  T extends [AnyMonarchType, ...AnyMonarchType[]],
> = {
  [K in keyof T]: InferTypeInput<T[K]>;
};
export type InferTypeTupleOutput<
  T extends [AnyMonarchType, ...AnyMonarchType[]],
> = {
  [K in keyof T]: InferTypeOutput<T[K]>;
};

export type InferTypeTaggedUnionInput<
  T extends Record<string, AnyMonarchType>,
> = {
  [K in keyof T]: { tag: K; value: InferTypeInput<T[K]> };
}[keyof T];
export type InferTypeTaggedUnionOutput<
  T extends Record<string, AnyMonarchType>,
> = {
  [K in keyof T]: { tag: K; value: InferTypeOutput<T[K]> };
}[keyof T];
