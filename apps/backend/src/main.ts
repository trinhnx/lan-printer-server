import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: true, // Allow all origins for LAN access
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true,
  });

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Bind to all network interfaces
  
  console.log(`🚀 Printer Server Backend running on: http://0.0.0.0:${port}`);
  console.log(`📄 API Documentation: http://0.0.0.0:${port}/api`);
}
bootstrap();
