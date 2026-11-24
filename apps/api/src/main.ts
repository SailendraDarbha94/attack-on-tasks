import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // The methods list is not redundant. @fastify/cors defaults to GET, HEAD and
  // POST only, so a bare enableCors() fails the preflight for every PATCH and
  // DELETE, and only from a browser: a phone never preflights.
  app.enableCors({ methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  // whitelist strips unknown body fields; transform coerces to the DTO types.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT ?? 4000);
  // 0.0.0.0 so a phone on the same Wi-Fi can reach the API during development.
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
