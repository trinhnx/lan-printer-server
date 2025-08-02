import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PrintService, PrintJob, PrinterInfo } from './print.service';

@Controller('print')
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  private getSourceInfo(req: Request) {
    // Get real IP address considering proxies
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                     'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Try to get hostname from reverse DNS lookup (optional enhancement)
    return {
      ipAddress: ipAddress.replace('::ffff:', ''), // Remove IPv6 prefix if present
      userAgent,
    };
  }

  @Get('printers')
  async getPrinters(): Promise<PrinterInfo[]> {
    return this.printService.getPrinters();
  }

  @Get('default-printer')
  async getDefaultPrinter(): Promise<{ name: string | null }> {
    const defaultPrinter = await this.printService.getDefaultPrinter();
    return { name: defaultPrinter };
  }

  @Post('upload-and-print')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, callback) => {
        // Allow common document and image formats
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/bmp',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Unsupported file type'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  async uploadAndPrint(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body('printerName') printerName?: string,
  ): Promise<{ jobId: string; message: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const sourceInfo = this.getSourceInfo(req);
      const jobId = await this.printService.printFile(file.path, printerName, undefined, sourceInfo);
      return {
        jobId,
        message: 'Print job submitted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to print file: ${error.message}`);
    }
  }

  @Post('file')
  async printUploadedFile(
    @Body() printRequest: { 
      filename: string; 
      printerName?: string; 
      options?: {
        paperSize?: string;
        duplex?: 'simplex' | 'duplex' | 'tumble';
        copies?: number;
      };
    },
    @Req() req: Request,
  ): Promise<{ jobId: string; message: string }> {
    try {
      const { filename, printerName, options } = printRequest;
      
      if (!filename) {
        throw new BadRequestException('Filename is required');
      }

      // Fix the path to point to the uploads directory at the project root
      const filePath = join(process.cwd(), '..', '..', 'uploads', filename);
      const sourceInfo = this.getSourceInfo(req);
      const jobId = await this.printService.printFile(filePath, printerName, options, sourceInfo);

      return {
        jobId,
        message: 'Print job submitted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to print file: ${error.message}`);
    }
  }

  @Get('jobs')
  async getPrintJobs(): Promise<PrintJob[]> {
    return this.printService.getAllPrintJobs();
  }

  @Get('jobs/:jobId')
  async getPrintJob(@Param('jobId') jobId: string): Promise<PrintJob> {
    const job = this.printService.getPrintJob(jobId);
    if (!job) {
      throw new NotFoundException('Print job not found');
    }
    return job;
  }
}
