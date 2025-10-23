import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvParams } from '@app/shared/enums';
import { useContainer } from 'class-validator';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  const logger = app.get<Logger>(Logger);
  const config = app.get<ConfigService>(ConfigService);

  const HOST = config.getOrThrow<string>(EnvParams.HOST);
  const PORT = config.getOrThrow<number>(EnvParams.PORT);

  const documentConfig = new DocumentBuilder()
    .setTitle('Forest API')
    .setVersion('1.0.0')
    .addServer('api/v1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api', app, document);

  app.useLogger(logger);
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });
  // ? Think about it, there can be multiple clients
  // app.enableCors({
  //   origin: config.get<string>(EnvParams.CLIENT_URL),
  //   credentials: true,
  // } as CorsOptions);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transformOptions: {
        exposeUnsetFields: false,
      },
      forbidNonWhitelisted: true,
    }),
  );

  useContainer(app.select(AppModule), {
    fallback: true,
    fallbackOnErrors: true,
  });

  await app.listen(PORT, HOST, () => {
    logger.log(`Service is running on http://${HOST}:${PORT}`);
  });
}
void bootstrap();
