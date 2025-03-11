import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: 'server/prisma/.env' })],
  // ... other module properties
})
export class AppModule {}