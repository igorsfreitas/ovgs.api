import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Violação de uma regra de negócio do domínio
 * (ex.: tipo de transporte não autorizado para o cliente).
 *
 * Mapeada para HTTP 422 (Unprocessable Entity): a requisição é sintaticamente
 * válida, mas não satisfaz uma invariante de negócio.
 */
export class BusinessRuleException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Business Rule Violation',
        message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
