import type { Pretty } from "../type-helpers";
import type { MonarchType } from "./type";

export type InferTypeInput<T> = T extends MonarchType<infer U, any> ? U : never;
export type InferTypeOutput<T> = T extends MonarchType<any, infer U>
  ? U
  : never;

export type InferTypeObjectInput<T extends Record<string, MonarchType<any>>> =
  Pretty<
    {
      [K in keyof T as undefined extends InferTypeInput<T[K]>
        ? never
        : K]: InferTypeInput<T[K]>; // required keys
    } & {
      [K in keyof T as undefined extends InferTypeInput<T[K]>
        ? K
        : never]?: InferTypeInput<T[K]>; // optional keys
    }
  >;
export type InferTypeObjectOutput<T extends Record<string, MonarchType<any>>> =
  Pretty<{
    [K in keyof T]: InferTypeOutput<T[K]>;
  }>;

export type InferTypeTupleInput<
  T extends [MonarchType<any>, ...MonarchType<T>[]],
> = {
  [K in keyof T]: InferTypeInput<T[K]>;
};
export type InferTypeTupleOutput<
  T extends [MonarchType<any>, ...MonarchType<T>[]],
> = {
  [K in keyof T]: InferTypeOutput<T[K]>;
};

export type InferTypeTaggedUnionInput<
  T extends Record<string, MonarchType<any>>,
> = {
  [K in keyof T]: { tag: K; value: InferTypeInput<T[K]> };
}[keyof T];
export type InferTypeTaggedUnionOutput<
  T extends Record<string, MonarchType<any>>,
> = {
  [K in keyof T]: { tag: K; value: InferTypeOutput<T[K]> };
}[keyof T];
