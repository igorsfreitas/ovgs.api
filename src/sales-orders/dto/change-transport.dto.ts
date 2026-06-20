import { IsUUID } from 'class-validator';

export class ChangeTransportDto {
  @IsUUID('4')
  transportTypeId: string;
}
