import { BadRequestException, ValidationError } from '@nestjs/common';

export interface ValidationErrorResponse {
  statusCode: 400;
  error: 'Bad Request';
  message: string[];
}

function flattenValidationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const propertyMessages = Object.values(error.constraints ?? {}).map((message) =>
      message.toLowerCase().startsWith(`${error.property.toLowerCase()} `)
        ? message
        : `${error.property} ${message}`,
    );
    return [...propertyMessages, ...flattenValidationMessages(error.children ?? [])];
  });
}

export function validationErrorResponse(errors: ValidationError[]): ValidationErrorResponse {
  return {
    statusCode: 400,
    error: 'Bad Request',
    message: flattenValidationMessages(errors),
  };
}

export function createValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException(validationErrorResponse(errors));
}
