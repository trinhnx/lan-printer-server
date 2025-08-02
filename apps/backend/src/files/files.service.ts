import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadTime: Date;
  sourceInfo?: {
    ipAddress: string;
    hostname?: string;
    userAgent?: string;
  };
}

@Injectable()
export class FilesService {
  private readonly uploadPath = path.join(process.cwd(), '..', '..', 'uploads');
  private readonly metadataPath = path.join(this.uploadPath, '.metadata');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
    
    // Ensure metadata directory exists
    if (!fs.existsSync(this.metadataPath)) {
      fs.mkdirSync(this.metadataPath, { recursive: true });
    }
  }

  async getUploadedFiles(): Promise<FileInfo[]> {
    try {
      const files = fs.readdirSync(this.uploadPath);
      const fileInfos: FileInfo[] = [];

      for (const filename of files) {
        const filePath = path.join(this.uploadPath, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const metadata = this.getFileMetadata(filename);
          fileInfos.push({
            filename,
            originalName: metadata.originalName || filename,
            size: stats.size,
            mimetype: metadata.uploadTime ? this.getMimeType(filename) : this.getMimeType(filename),
            uploadTime: metadata.uploadTime || stats.birthtime,
            sourceInfo: metadata.sourceInfo,
          });
        }
      }

      return fileInfos.sort((a, b) => b.uploadTime.getTime() - a.uploadTime.getTime());
    } catch (error) {
      console.error('Error reading uploaded files:', error);
      return [];
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  fileExists(filename: string): boolean {
    return fs.existsSync(path.join(this.uploadPath, filename));
  }

  async storeFileMetadata(
    filename: string, 
    originalName: string, 
    mimetype: string,
    sourceInfo: {
      ipAddress: string;
      hostname?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const metadata = {
      filename,
      originalName,
      mimetype,
      uploadTime: new Date(),
      sourceInfo,
    };
    
    const metadataFile = path.join(this.metadataPath, `${filename}.json`);
    try {
      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error storing file metadata:', error);
    }
  }

  private getFileMetadata(filename: string): Partial<FileInfo> {
    const metadataFile = path.join(this.metadataPath, `${filename}.json`);
    try {
      if (fs.existsSync(metadataFile)) {
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        return {
          originalName: metadata.originalName,
          sourceInfo: metadata.sourceInfo,
          uploadTime: new Date(metadata.uploadTime),
        };
      }
    } catch (error) {
      console.error('Error reading file metadata:', error);
    }
    return {};
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
