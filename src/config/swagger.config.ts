import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle('Coffees API')
    .setDescription('Coffees API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
};
