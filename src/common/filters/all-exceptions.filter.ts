import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

/**
 * Filtro global que padroniza o corpo de erro de toda a API e centraliza o log.
 * - `HttpException` preserva status e mensagem (inclui erros de validação do DTO).
 * - Qualquer outra exceção vira 500 com mensagem genérica (sem vazar detalhes),
 *   mas com stack registrado no log para diagnóstico.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildBody(exception, status, request.url);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status}: ${JSON.stringify(body.message)}`,
      );
    }

    response.status(status).json(body);
  }

  private buildBody(
    exception: unknown,
    status: number,
    path: string,
  ): ErrorResponseBody {
    let error = HttpStatus[status] ?? 'Error';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const record = res as Record<string, unknown>;
        message = (record.message as string | string[]) ?? exception.message;
        if (typeof record.error === 'string') {
          error = record.error;
        }
      }
    }

    return {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
