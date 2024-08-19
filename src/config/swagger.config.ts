import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const options = new DocumentBuilder()
  .setTitle('Coffees example')
  .setDescription('The coffee API description')
  .setVersion('1.0')
  .build();

export default (app: INestApplication) => {
  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api', app, document);
};
