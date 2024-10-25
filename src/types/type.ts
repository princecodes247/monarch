import { MonarchParseError } from "../errors";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export const phantom: unique symbol = Symbol("monarch phantom");
export type MonarchPhantom = typeof phantom;

export type Parser<Input, Output> = (input: Input) => Output;

export function pipeParser<Input, InterOutput, Output>(
  prevParser: Parser<Input, InterOutput>,
  nextParser: Parser<InterOutput, Output>,
): Parser<Input, Output> {
  return (input) => nextParser(prevParser(input));
}

export const type = <TInput, TOutput = TInput>(
  parser: Parser<TInput, TOutput>,
) => new MonarchType(parser);

export class MonarchType<TInput, TOutput> {
  constructor(
    public _parser: Parser<TInput, TOutput>,
    public readonly _updater?: Parser<void, TOutput>,
  ) {}

  public nullable() {
    return new MonarchNullable(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      this._updater as Parser<void, InferTypeOutput<this>>,
    );
  }

  public optional() {
    return new MonarchOptional(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      this._updater as Parser<void, InferTypeOutput<this>>,
    );
  }

  public default(defaultInput: TInput | (() => TInput)) {
    return new MonarchDefaulted(
      defaultInput as InferTypeInput<this> | (() => InferTypeInput<this>),
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      this._updater as Parser<void, InferTypeOutput<this>>,
    );
  }

  public onUpdate(updateFn: () => TInput) {
    return new MonarchType(this._parser, pipeParser(updateFn, this._parser));
  }

  public pipe<T extends AnyMonarchType<TOutput, any>>(type: T) {
    return new MonarchPipe(this, type);
  }

  /**
   * Transform input.
   *
   * Transform is applied after previous validations and transforms have been applied.
   * @param fn function that returns a transformed input.
   */
  public transform<TTransformOutput>(fn: (input: TOutput) => TTransformOutput) {
    return new MonarchType(
      pipeParser(this._parser, fn),
      this._updater && pipeParser(this._updater, fn),
    );
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
      pipeParser(this._parser, (input) => {
        const valid = fn(input);
        if (!valid) throw new MonarchParseError(message);
        return input;
      }),
      this._updater,
    );
  }
}

export class MonarchPipe<
  TPipeIn extends AnyMonarchType,
  TPipeOut extends AnyMonarchType<InferTypeOutput<TPipeIn>, any>,
> extends MonarchType<InferTypeInput<TPipeIn>, InferTypeOutput<TPipeOut>> {
  constructor(pipeIn: TPipeIn, pipeOut: TPipeOut) {
    super(
      pipeParser(pipeIn._parser, pipeOut._parser),
      pipeIn._updater && pipeParser(pipeIn._updater, pipeOut._parser),
    );
  }
}

export class MonarchNullable<T extends AnyMonarchType> extends MonarchType<
  InferTypeInput<T> | null,
  InferTypeOutput<T> | null
> {
  constructor(
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    updater?: Parser<void, InferTypeOutput<T>>,
  ) {
    super((input) => {
      if (input === null) return null;
      return parser(input);
    }, updater);
  }
}

export class MonarchOptional<T extends AnyMonarchType> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T> | undefined
> {
  constructor(
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    updater?: Parser<void, InferTypeOutput<T>>,
  ) {
    super((input) => {
      if (input === undefined) return undefined;
      return parser(input);
    }, updater);
  }
}

export class MonarchDefaulted<T extends AnyMonarchType> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T>
> {
  constructor(
    defaultInput: InferTypeInput<T> | (() => InferTypeInput<T>),
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    updater?: Parser<void, InferTypeOutput<T>>,
  ) {
    super((input) => {
      if (input === undefined) {
        const defaultValue = MonarchDefaulted.isDefaultFunction(defaultInput)
          ? defaultInput()
          : defaultInput;
        return parser(defaultValue);
      }
      return parser(input);
    }, updater);
  }

  private static isDefaultFunction<T>(val: unknown): val is () => T {
    return typeof val === "function";
  }
}

export type AnyMonarchType<TInput = any, TOutput = TInput> = MonarchType<
  TInput,
  TOutput
>;
