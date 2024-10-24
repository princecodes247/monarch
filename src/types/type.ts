import { MonarchParseError } from "../errors";
import type { InferTypeInput, InferTypeOutput } from "./type-helpers";

export type Parser<Input, Output> = (input: Input) => Output;
export type Scope = Record<"sub" | "root", boolean>;
export const Scopes = {
  Default: { root: true, sub: true },
  RootOnly: { root: true, sub: false },
  SubOnly: { root: true, sub: false },
} satisfies Record<string, Scope>;

export function applyParser<Input, InterOutput, Output>(
  prevParser: Parser<Input, InterOutput>,
  parser: Parser<InterOutput, Output>,
): Parser<Input, Output> {
  return (input) => parser(prevParser(input));
}

export const type = <TInput, TOutput = TInput>(
  parser: Parser<TInput, TOutput>,
) => new MonarchType(parser, Scopes.Default);

export class MonarchType<TInput, TOutput, TScope extends Scope> {
  constructor(
    public _parser: Parser<TInput, TOutput>,
    public _scope: TScope,
  ) {}
  public _updateFn: (() => TOutput) | null = null;

  public nullable() {
    return new MonarchNullable(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      this._scope,
    );
  }

  public optional() {
    return new MonarchOptional(
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      this._scope,
    );
  }

  public default(defaultInput: TInput | (() => TInput)) {
    return new MonarchDefaulted(
      defaultInput as InferTypeInput<this> | (() => InferTypeInput<this>),
      this._parser as Parser<InferTypeInput<this>, InferTypeOutput<this>>,
      this._scope,
    );
  }

  public onUpdate(updateFn: () => TInput) {
    const clone = type(this._parser);
    clone._updateFn = () => this._parser(updateFn());
    return clone;
  }

  public pipe<T extends AnyMonarchType>(type: T) {
    return new MonarchPipe(this, type, this._scope);
  }

  /**
   * Transform input.
   *
   * Transform is applied after previous validations and transforms have been applied.
   * @param fn function that returns a transformed input.
   */
  public transform<TTransformOutput>(fn: (input: TOutput) => TTransformOutput) {
    return new MonarchType(applyParser(this._parser, fn), this._scope);
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
      this._scope,
    );
  }
}

export class MonarchPipe<
  TPipeIn extends AnyMonarchType,
  TPipeOut extends AnyMonarchType<InferTypeOutput<TPipeIn>, any>,
  TScope extends Scope,
> extends MonarchType<
  InferTypeInput<TPipeIn>,
  InferTypeOutput<TPipeOut>,
  TScope
> {
  constructor(pipeIn: TPipeIn, pipeOut: TPipeOut, scope: TScope) {
    super((input) => {
      const parsedInput = pipeIn._parser(input);
      return pipeOut._parser(parsedInput);
    }, scope);
  }
}

export class MonarchNullable<
  T extends AnyMonarchType,
  TScope extends Scope,
> extends MonarchType<
  InferTypeInput<T> | null,
  InferTypeOutput<T> | null,
  TScope
> {
  constructor(
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    scope: TScope,
  ) {
    super((input) => {
      if (input === null) return null;
      return parser(input);
    }, scope);
  }
}

export class MonarchOptional<
  T extends AnyMonarchType,
  TScope extends Scope,
> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T> | undefined,
  TScope
> {
  constructor(
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    scope: TScope,
  ) {
    super((input) => {
      if (input === undefined) return undefined;
      return parser(input);
    }, scope);
  }
}

export class MonarchDefaulted<
  T extends AnyMonarchType,
  TScope extends Scope,
> extends MonarchType<
  InferTypeInput<T> | undefined,
  InferTypeOutput<T>,
  TScope
> {
  constructor(
    defaultInput: InferTypeInput<T> | (() => InferTypeInput<T>),
    parser: Parser<InferTypeInput<T>, InferTypeOutput<T>>,
    scope: TScope,
  ) {
    super((input) => {
      if (input === undefined) {
        const defaultValue = MonarchDefaulted.isDefaultFunction(defaultInput)
          ? defaultInput()
          : defaultInput;
        return parser(defaultValue);
      }
      return parser(input);
    }, scope);
  }

  private static isDefaultFunction<T>(val: unknown): val is () => T {
    return typeof val === "function";
  }
}

export type AnyMonarchType<TInput = any, TOutput = TInput> = MonarchType<
  TInput,
  TOutput,
  any
>;
export type AnyMonarchSubType<TInput = any, TOutput = TInput> = MonarchType<
  TInput,
  TOutput,
  { sub: true; root: any }
>;
export type AnyMonarchRootType<TInput = any, TOutput = TInput> = MonarchType<
  TInput,
  TOutput,
  { sub: any; root: true }
>;
