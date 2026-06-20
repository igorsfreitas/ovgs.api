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
  define(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ScheduleDto) {
    return this.scheduling.define(id, dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduling.confirm(id);
  }

  @Post('reschedule')
  @HttpCode(HttpStatus.OK)
  reschedule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ScheduleDto) {
    return this.scheduling.reschedule(id, dto);
  }
}
