import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadTime: Date;
}

@Injectable()
export class FilesService {
  private readonly uploadPath = path.join(process.cwd(), '..', '..', 'uploads');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
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
          fileInfos.push({
            filename,
            originalName: filename, // In a real app, you'd store this mapping
            size: stats.size,
            mimetype: this.getMimeType(filename),
            uploadTime: stats.birthtime,
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
