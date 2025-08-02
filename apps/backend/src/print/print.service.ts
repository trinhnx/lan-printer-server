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
  sourceInfo?: {
    ipAddress: string;
    hostname?: string;
    userAgent?: string;
  };
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
    },
    sourceInfo?: {
      ipAddress: string;
      hostname?: string;
      userAgent?: string;
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
      sourceInfo,
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

      console.log(`Starting print job for ${filename} from IP: ${sourceInfo?.ipAddress || 'unknown'}`);
      console.log(`File path: ${filePath}`);
      console.log(`Printer: ${printerName || 'default'}`);
      console.log(`Options:`, options);

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
      
      // Use a simpler, more reliable print approach
      if (printerName) {
        // Print to specific printer using rundll32
        printCommand = `rundll32.exe shimgvw.dll,ImageView_PrintTo /pt "${filePath}" "${printerName}"`;
      } else {
        // Print to default printer using Windows default print association
        printCommand = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print -Wait"`;
      }

      console.log(`Executing print command: ${printCommand}`);
      
      const result = await execAsync(printCommand);
      
      console.log(`Print command executed successfully for ${filename} from ${sourceInfo?.ipAddress || 'unknown'}`);
      console.log(`Command output:`, result.stdout);
      if (result.stderr) {
        console.log(`Command stderr:`, result.stderr);
      }
      
      // Check print queue to verify job was submitted
      try {
        const queueCheck = await execAsync('powershell -Command "Get-PrintJob | Select-Object Name, PrinterName, JobStatus | ConvertTo-Json"');
        console.log(`Current print queue:`, queueCheck.stdout);
      } catch (queueError) {
        console.log(`Could not check print queue:`, queueError.message);
      }
      
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
