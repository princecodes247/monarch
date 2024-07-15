export type Merge<First, Second> = Omit<First, keyof Second> & Second;
export type Pretty<T> = { [K in keyof T]: T[K] } & {};
export type KnownKey<T> = string extends T
  ? never
  : number extends T
  ? never
  : symbol extends T
  ? never
  : T;
export type KnownObjectKeys<T> = { [K in keyof T as KnownKey<K>]: T[K] };
