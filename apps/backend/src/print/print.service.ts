import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PrintJob {
  id: string;
  filename: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  timestamp: Date;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  status: string;
  isDefault: boolean;
}

@Injectable()
export class PrintService {
  private printJobs: Map<string, PrintJob> = new Map();

  async getPrinters(): Promise<PrinterInfo[]> {
    try {
      // Use PowerShell to get printer information
      const { stdout } = await execAsync(
        'powershell -Command "Get-Printer | Select-Object Name, PrinterStatus, Default | ConvertTo-Json"'
      );
      
      const printers = JSON.parse(stdout);
      const printerArray = Array.isArray(printers) ? printers : [printers];
      
      return printerArray.map((printer) => ({
        name: printer.Name,
        status: printer.PrinterStatus || 'Unknown',
        isDefault: printer.Default || false,
      }));
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  }

  async getDefaultPrinter(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        'powershell -Command "Get-WmiObject -Query \\"SELECT * FROM Win32_Printer WHERE Default=$true\\" | Select-Object -ExpandProperty Name"'
      );
      
      return stdout.trim() || null;
    } catch (error) {
      console.error('Error getting default printer:', error);
      return null;
    }
  }

  async printFile(
    filePath: string, 
    printerName?: string,
    options?: {
      paperSize?: string;
      duplex?: 'simplex' | 'duplex' | 'tumble';
      copies?: number;
    }
  ): Promise<string> {
    const jobId = this.generateJobId();
    const filename = path.basename(filePath);
    
    // Create print job
    const printJob: PrintJob = {
      id: jobId,
      filename,
      status: 'pending',
      timestamp: new Date(),
    };
    
    this.printJobs.set(jobId, printJob);

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Update status to printing
      printJob.status = 'printing';
      this.printJobs.set(jobId, printJob);

      let printCommand: string;
      const fileExtension = path.extname(filePath).toLowerCase();
      const copies = options?.copies || 1;
      
      // Build PowerShell print arguments
      let printArgs = '';
      if (options?.paperSize && options.paperSize !== 'A4') {
        printArgs += ` -PaperSize '${options.paperSize}'`;
      }
      if (options?.duplex && options.duplex !== 'simplex') {
        const duplexMode = options.duplex === 'duplex' ? 'TwoSidedLongEdge' : 'TwoSidedShortEdge';
        printArgs += ` -Duplex '${duplexMode}'`;
      }
      if (copies > 1) {
        printArgs += ` -Copies ${copies}`;
      }
      
      if (printerName) {
        // Print to specific printer with options
        if (fileExtension === '.pdf') {
          // For PDF files, use PowerShell with print settings
          printCommand = `powershell -Command "& { $printer = Get-Printer -Name '${printerName}'; for ($i = 1; $i -le ${copies}; $i++) { Start-Process -FilePath '${filePath}' -ArgumentList '/d:${printerName}' -WindowStyle Hidden -Wait } }"`;
        } else {
          // For other files, use PowerShell printing with basic settings
          printCommand = `powershell -Command "& { for ($i = 1; $i -le ${copies}; $i++) { Start-Process -FilePath '${filePath}' -Verb Print -WindowStyle Hidden } }"`;
        }
      } else {
        // Print to default printer with copies
        printCommand = `powershell -Command "& { for ($i = 1; $i -le ${copies}; $i++) { Start-Process -FilePath '${filePath}' -Verb Print -WindowStyle Hidden } }"`;
      }

      await execAsync(printCommand);
      
      // Update status to completed
      printJob.status = 'completed';
      this.printJobs.set(jobId, printJob);
      
      // Clean up the file after printing (optional)
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }, 5000); // Wait 5 seconds before cleanup

      return jobId;
    } catch (error) {
      // Update status to failed
      printJob.status = 'failed';
      printJob.error = error.message;
      this.printJobs.set(jobId, printJob);
      
      throw error;
    }
  }

  getPrintJob(jobId: string): PrintJob | undefined {
    return this.printJobs.get(jobId);
  }

  getAllPrintJobs(): PrintJob[] {
    return Array.from(this.printJobs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
