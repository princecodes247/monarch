export interface Parser<Input, Output = Input> {
  validate: (input: Input) => Input;
  transform: (input: Input) => Output;
}

export const noopParser = <T>(): Parser<T, T> => ({
  validate: (input) => input,
  transform: (input) => input,
});

export const schema = <TInput, TOutput = TInput>(
  parser: Parser<TInput, TOutput>
) => new Schema(parser);

export type InferSchemaInput<T> = T extends Schema<infer U, any> ? U : never;
export type InferSchemaOutput<T> = T extends Schema<any, infer U> ? U : never;

export class Schema<TInput, TOutput = TInput> {
  constructor(public _parser: Parser<TInput, TOutput>) {}

  nullable() {
    return new NullableSchema(
      this._parser as Parser<InferSchemaInput<this>, InferSchemaOutput<this>>
    );
  }

  optional() {
    return new OptionalSchema(
      this._parser as Parser<InferSchemaInput<this>, InferSchemaOutput<this>>
    );
  }

  default(defaultInput: TInput | (() => TInput)) {
    return new DefaultedSchema(
      this._parser as Parser<InferSchemaInput<this>, InferSchemaOutput<this>>,
      defaultInput as InferSchemaInput<this> | (() => InferSchemaInput<this>)
    );
  }

  transform<TTransformOutput>(fn: (input: TOutput) => TTransformOutput) {
    return new Schema({
      validate: this._parser.validate,
      transform: (input) => fn(this._parser.transform(input)),
    });
  }
}

export class NullableSchema<TSchema extends Schema<any>> extends Schema<
  InferSchemaInput<TSchema> | null,
  InferSchemaOutput<TSchema> | null
> {
  constructor(
    parser: Parser<InferSchemaInput<TSchema>, InferSchemaOutput<TSchema>>
  ) {
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

export class OptionalSchema<TSchema extends Schema<any>> extends Schema<
  InferSchemaInput<TSchema> | undefined,
  InferSchemaOutput<TSchema> | undefined
> {
  constructor(
    parser: Parser<InferSchemaInput<TSchema>, InferSchemaOutput<TSchema>>
  ) {
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

export class DefaultedSchema<TSchema extends Schema<any>> extends Schema<
  InferSchemaInput<TSchema>,
  InferSchemaOutput<TSchema>
> {
  constructor(
    parser: Parser<InferSchemaInput<TSchema>, InferSchemaOutput<TSchema>>,
    defaultInput: InferSchemaInput<TSchema> | (() => InferSchemaInput<TSchema>)
  ) {
    super({
      validate: (input) => {
        return parser.validate(input);
      },
      transform: (input) => {
        if (input === null || input === undefined) {
          const value = DefaultedSchema.isDefaultFunction(defaultInput)
            ? defaultInput()
            : defaultInput;
          return parser.transform(value);
        }
        return parser.transform(input);
      },
    });
  }

  static isDefaultFunction<T>(val: unknown): val is () => T {
    return typeof val === "function";
  }
}
