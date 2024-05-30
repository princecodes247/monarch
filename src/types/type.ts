export interface Parser<Input, Output = Input> {
  validate: (input: Input) => Input;
  transform: (input: Input) => Output;
}

export const noopParser = <T>(): Parser<T, T> => ({
  validate: (input) => input,
  transform: (input) => input,
});

export const type = <TInput, TOutput = TInput>(
  parser: Parser<TInput, TOutput>
) => new MonarchType(parser);

export type InferTypeInput<T> = T extends MonarchType<infer U, any> ? U : never;
export type InferTypeOutput<T> = T extends MonarchType<any, infer U>
  ? U
  : never;

export class MonarchType<TInput, TOutput = TInput> {
  constructor(public _parser: Parser<TInput, TOutput>) {}

  public nullable() {
    return new MonarchNullable(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>
    );
  }

  public optional() {
    return new MonarchOptional(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>
    );
  }

  public default(defaultInput: TInput | (() => TInput)) {
    return new MonarchDefaulted(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      defaultInput as InferTypeInput<this> | (() => InferTypeInput<this>)
    );
  }

  public transform<TTransformOutput>(fn: (input: TOutput) => TTransformOutput) {
    return new MonarchType({
      validate: this._parser.validate,
      transform: (input) => fn(this._parser.transform(input)),
    });
  }
}

export class MonarchNullable<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T> | null,
  InferTypeOutput<T> | null
> {
  constructor(parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>) {
    super({
      validate: (input) => {
        if (input === null) return null;
        return parser.validate(input);
      },
      transform: (input) => {
        if (input === null) return null;
        return parser.transform(input);
      },
    });
  }
}

export class MonarchOptional<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T> | undefined
> {
  constructor(parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>) {
    super({
      validate: (input) => {
        if (input === undefined) return undefined;
        return parser.validate(input);
      },
      transform: (input) => {
        if (input === undefined) return undefined;
        return parser.transform(input);
      },
    });
  }
}

export class MonarchDefaulted<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T>,
  InferTypeOutput<T>
> {
  constructor(
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    defaultInput: InferTypeInput<T> | (() => InferTypeInput<T>)
  ) {
    super({
      validate: (input) => {
        return parser.validate(input);
      },
      transform: (input) => {
        if (input === null || input === undefined) {
          const value = MonarchDefaulted.isDefaultFunction(defaultInput)
            ? defaultInput()
            : defaultInput;
          return parser.transform(value);
        }
        return parser.transform(input);
      },
    });
  }

  private static isDefaultFunction<T>(val: unknown): val is () => T {
    return typeof val === "function";
  }
}
