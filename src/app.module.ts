import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoffeeModule } from './coffee/coffees.module';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import validationConfig from './config/validation.config';
import dbConfig from './config/db.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
      validationSchema: validationConfig,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: dbConfig,
    }),
    CoffeeModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
