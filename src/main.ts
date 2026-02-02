import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  });
  const config = new DocumentBuilder()
    .setTitle('Edu Learning Platform')
    .setDescription('Edu API')
    .setVersion('1.0')
    .addTag('Learning')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
