import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrintModule } from './print/print.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    PrintModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
