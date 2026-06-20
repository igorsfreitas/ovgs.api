import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ScheduleDto } from './dto/schedule.dto';
import { SchedulingService } from './scheduling.service';

@Controller('sales-orders/:id/schedule')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduling.findByOrder(id);
  }

  @Put()
  define(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scheduling.define(id, dto, user.email);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scheduling.confirm(id, user.email);
  }

  @Post('reschedule')
  @HttpCode(HttpStatus.OK)
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scheduling.reschedule(id, dto, user.email);
  }
}
