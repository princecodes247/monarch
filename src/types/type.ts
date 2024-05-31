import { MonarchParseError } from "../errors";

export type Parser<Input, Output> = (input: Input) => Output;

export function applyParser<Input, InterOutput, Output>(
  prevParser: Parser<Input, InterOutput>,
  parser: Parser<InterOutput, Output>
): Parser<Input, Output> {
  return (input) => parser(prevParser(input));
}

export const type = <TInput, TOutput>(parser: Parser<TInput, TOutput>) =>
  new MonarchType(parser);

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

  public pipe<T extends MonarchType<TOutput, any>>(type: T) {
    return new MonarchPipe(this, type);
  }

  /**
   * Transform input.
   *
   * Transform is applied after previous validations and transforms have been applied.
   * @param fn function that returns a transformed input.
   */
  public transform<TTransformOutput>(fn: (input: TOutput) => TTransformOutput) {
    return new MonarchType(applyParser(this._parser, fn));
  }

  /**
   * Validate input.
   *
   * Validation is applied after previous validations and transforms have been applied.
   * @param fn function that returns `true` for successful validation and `false` for failed validation.
   * @param message error message when validation fails.
   */
  public validate(fn: (input: TOutput) => boolean, message: string) {
    return new MonarchType(
      applyParser(this._parser, (input) => {
        const valid = fn(input);
        if (!valid) throw new MonarchParseError(message);
        return input;
      })
    );
  }
}

export class MonarchPipe<
  TPipeIn extends MonarchType<any>,
  TPipeOut extends MonarchType<InferTypeOutput<TPipeIn>, any>
> extends MonarchType<InferTypeInput<TPipeIn>, InferTypeOutput<TPipeOut>> {
  constructor(pipeIn: TPipeIn, pipeOut: TPipeOut) {
    super((input) => {
      const parsedInput = pipeIn._parser(input);
      return pipeOut._parser(parsedInput);
    });
  }
}

export class MonarchNullable<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T> | null,
  InferTypeOutput<T> | null
> {
  constructor(parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>) {
    super((input) => {
      if (input === null) return null;
      return parser(input);
    });
  }
}

export class MonarchOptional<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T> | undefined
> {
  constructor(parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>) {
    super((input) => {
      if (input === undefined) return undefined;
      return parser(input);
    });
  }
}

export class MonarchDefaulted<T extends MonarchType<any>> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T>
> {
  constructor(
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    defaultInput: InferTypeInput<T> | (() => InferTypeInput<T>)
  ) {
    super((input) => {
      if (input === undefined) {
        const defaultValue = MonarchDefaulted.isDefaultFunction(defaultInput)
          ? defaultInput()
          : defaultInput;
        return parser(defaultValue);
      }
      return parser(input);
    });
  }

  private static isDefaultFunction<T>(val: unknown): val is () => T {
    return typeof val === "function";
  }
}
