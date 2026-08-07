import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/config/prisma.service';
import { NotificationLog, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.NotificationLogCreateInput): Promise<NotificationLog> {
    return this.prisma.notificationLog.create({ data });
  }

  async findAll(): Promise<NotificationLog[]> {
    return this.prisma.notificationLog.findMany();
  }
}
