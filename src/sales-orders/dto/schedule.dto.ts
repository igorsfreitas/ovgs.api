import { IsDateString, Matches } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleDto {
  /** Data de entrega (YYYY-MM-DD). */
  @IsDateString()
  deliveryDate: string;

  /** Início da janela de atendimento (HH:MM). */
  @Matches(TIME_PATTERN, { message: 'windowStart must be in HH:MM format' })
  windowStart: string;

  /** Fim da janela de atendimento (HH:MM). */
  @Matches(TIME_PATTERN, { message: 'windowEnd must be in HH:MM format' })
  windowEnd: string;
}
