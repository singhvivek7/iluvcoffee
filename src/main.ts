import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import swaggerConfig from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cors
  app.enableCors();

  // Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  swaggerConfig(app);

  await app.listen(3000);
}
bootstrap();
