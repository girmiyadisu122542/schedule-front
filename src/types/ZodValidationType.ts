export interface ZodValidationError {
    _errors?: string[];
    [key: string]:
        | {
              _errors: string[];
          }
        | string[]
        | undefined;
}
