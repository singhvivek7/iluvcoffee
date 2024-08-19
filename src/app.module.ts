import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoffeeModule } from './coffee/coffees.module';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import validationConfig from './config/validation.config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
      validationSchema: validationConfig,
    }),
    MongooseModule.forRoot(process.env.MONGOOSE_URI),
    CoffeeModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
