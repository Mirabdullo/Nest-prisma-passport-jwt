import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { connect } from 'http2';

@Injectable()
export class PrismaService
extends PrismaClient
implements OnModuleInit, OnModuleDestroy 
{
    constructor() {
        super({
            datasources: {
                db: {
                    url: 'postgresql://postgres:salom@localhost:5432/nest-prisma?schema=public'
                },
            }
        })
    }
    async onModuleInit() {
        await this.$connect()
    }

    async onModuleDestroy() {
        this.$disconnect()
    }
}
