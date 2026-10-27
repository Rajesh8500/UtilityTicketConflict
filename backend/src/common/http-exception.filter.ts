import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorEnvelope {
  statusCode: number;
  error: string;
  message: string | string[];
}

@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      response.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected server error occurred',
      });
      return;
    }

    const statusCode = exception.getStatus();
    if (statusCode >= 500) {
      response.status(statusCode).json({
        statusCode,
        error: 'Internal Server Error',
        message: 'An unexpected server error occurred',
      });
      return;
    }

    const body = exception.getResponse();
    const message =
      typeof body === 'string'
        ? body
        : (body as Partial<ErrorEnvelope>).message ?? exception.message;
    const error =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Partial<ErrorEnvelope>).error)
        : exception.name;

    response.status(statusCode).json({ statusCode, error, message });
  }
}
