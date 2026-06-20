import { HttpException, HttpStatus } from '@nestjs/common';
import { SalesOrderStatus } from '../enums/sales-order-status.enum';

/**
 * Tentativa de transição de status fora da sequência válida.
 * Mapeada para HTTP 409 (Conflict): o recurso existe, mas o estado atual não
 * permite a mudança solicitada.
 */
export class InvalidStatusTransitionException extends HttpException {
  constructor(from: SalesOrderStatus, to: SalesOrderStatus) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: 'Invalid Status Transition',
        message: `Cannot transition sales order from ${from} to ${to}`,
      },
      HttpStatus.CONFLICT,
    );
  }
}
