import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetAuthorizedTransportsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  transportTypeIds: string[];
}
