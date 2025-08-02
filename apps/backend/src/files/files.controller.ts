import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { createReadStream } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FilesService, FileInfo } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  private getSourceInfo(req: Request) {
    // Get real IP address considering proxies
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                     'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    return {
      ipAddress: ipAddress.replace('::ffff:', ''), // Remove IPv6 prefix if present
      userAgent,
    };
  }

  @Get()
  async getUploadedFiles(): Promise<FileInfo[]> {
    return this.filesService.getUploadedFiles();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), '..', '..', 'uploads'),
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, callback) => {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png', 'image/jpeg', 'image/gif', 'image/bmp',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('File type not supported'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<{ filename: string; originalName: string; message: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Store file metadata with source information
    const sourceInfo = this.getSourceInfo(req);
    await this.filesService.storeFileMetadata(
      file.filename,
      file.originalname,
      file.mimetype,
      sourceInfo
    );

    return {
      filename: file.filename,
      originalName: file.originalname,
      message: 'File uploaded successfully',
    };
  }

  @Get('preview/:filename')
  async previewFile(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const filePath = join(process.cwd(), '..', '..', 'uploads', filename);
    
    try {
      const file = createReadStream(filePath);
      const fileExtension = extname(filename).toLowerCase();
      
      // Set appropriate content type
      let contentType = 'application/octet-stream';
      switch (fileExtension) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.bmp':
          contentType = 'image/bmp';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.xls':
          contentType = 'application/vnd.ms-excel';
          break;
        case '.xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
      }
      
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      });
      
      return new StreamableFile(file);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string): Promise<{ message: string }> {
    const deleted = await this.filesService.deleteFile(filename);
    
    if (!deleted) {
      throw new NotFoundException('File not found');
    }
    
    return { message: 'File deleted successfully' };
  }
}
