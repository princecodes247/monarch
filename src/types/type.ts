import { MonarchParseError } from "../errors";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export type Parser<Input, Output> = (input: Input) => Output;

export function applyParser<Input, InterOutput, Output>(
  prevParser: Parser<Input, InterOutput>,
  parser: Parser<InterOutput, Output>,
): Parser<Input, Output> {
  return (input) => parser(prevParser(input));
}

export const type = <TInput, TOutput = TInput>(
  parser: Parser<TInput, TOutput>,
) => new MonarchType(parser);

export class MonarchType<TInput, TOutput> {
  constructor(public _parser: Parser<TInput, TOutput>) {}
  public _updateFn: (() => TOutput) | null = null;

  public nullable() {
    return new MonarchNullable(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
    );
  }

  public optional() {
    return new MonarchOptional(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
    );
  }

  public default(defaultInput: TInput | (() => TInput)) {
    return new MonarchDefaulted(
      defaultInput as InferTypeInput<this> | (() => InferTypeInput<this>),
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
    );
  }

  public onUpdate(updateFn: () => TInput) {
    const clone = type(this._parser);
    clone._updateFn = () => this._parser(updateFn());
    return clone;
  }

  public pipe<T extends AnyMonarchType>(type: T) {
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
      }),
    );
  }
}

export class MonarchPipe<
  TPipeIn extends AnyMonarchType,
  TPipeOut extends AnyMonarchType<InferTypeOutput<TPipeIn>, any>,
> extends MonarchType<InferTypeInput<TPipeIn>, InferTypeOutput<TPipeOut>> {
  constructor(pipeIn: TPipeIn, pipeOut: TPipeOut) {
    super((input) => {
      const parsedInput = pipeIn._parser(input);
      return pipeOut._parser(parsedInput);
    });
  }
}

export class MonarchNullable<T extends AnyMonarchType> extends MonarchType<
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

export class MonarchOptional<T extends AnyMonarchType> extends MonarchType<
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

export class MonarchDefaulted<T extends AnyMonarchType> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T>
> {
  constructor(
    defaultInput: InferTypeInput<T> | (() => InferTypeInput<T>),
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
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

export type AnyMonarchType<TInput = any, TOutput = TInput> = MonarchType<
  TInput,
  TOutput
>;
