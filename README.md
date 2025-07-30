# 🖨️ LAN Printer Server

A modern, professional printer server solution that allows devices on your local network to upload files and print them through a centralized printer server.

## 🌟 Features

- **🚀 Modern Stack**: Built with NestJS backend and Next.js frontend
- **📤 Drag & Drop Upload**: Intuitive file upload with drag and drop support
- **🖨️ Multi-Printer Support**: Select from available printers or use default
- **📊 Real-time Status**: Live print job tracking and printer status monitoring
- **🔄 Auto-refresh**: Real-time updates for print jobs and server status
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **🔒 File Validation**: Supports PDF, Word, Excel, images, and text files
- **⚡ Fast & Reliable**: Built for performance and reliability

## 🛠️ Technology Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **File Upload**: Multer for handling file uploads
- **Printer Integration**: Windows PowerShell commands for printing
- **API**: RESTful endpoints with proper error handling
- **File Management**: Automatic cleanup and file type validation

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: React hooks for real-time updates
- **File Upload**: Drag & drop interface with progress indicators
- **Real-time Updates**: Polling for live status updates

## 📁 Project Structure

```
printer-server/
├── apps/
│   ├── backend/          # NestJS backend application
│   │   ├── src/
│   │   │   ├── print/    # Print module (jobs, printers)
│   │   │   ├── files/    # File management module
│   │   │   └── uploads/  # File upload directory
│   │   └── package.json
│   └── frontend/         # Next.js frontend application
│       ├── src/
│       │   ├── app/      # Next.js app router
│       │   ├── components/ # React components
│       │   └── lib/      # API utilities
│       └── package.json
├── packages/             # Shared packages (future use)
└── package.json          # Root package.json (monorepo)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Windows OS (for printer integration)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Start both backend and frontend**:
   ```bash
   npm run dev
   ```

   Or start them individually:
   ```bash
   # Backend (port 3001)
   npm run dev:backend
   
   # Frontend (port 3000)
   npm run dev:frontend
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📖 API Documentation

### Print Endpoints
- `GET /api/print/printers` - Get available printers
- `GET /api/print/default-printer` - Get default printer
- `POST /api/print/upload-and-print` - Upload file and create print job
- `GET /api/print/jobs` - Get all print jobs
- `GET /api/print/jobs/:jobId` - Get specific print job

### File Management
- `GET /api/files` - Get uploaded files list
- `DELETE /api/files/:filename` - Delete uploaded file

### System
- `GET /api/health` - Server health check
- `GET /api` - API welcome message

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Supported File Types
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT
- **Images**: JPG, JPEG, PNG, GIF, BMP
- **Maximum Size**: 50MB per file

## 🖨️ Printer Integration

The application uses Windows PowerShell commands to interact with system printers:
- Automatically detects available printers
- Shows printer status and default printer
- Supports printing to specific printers
- Handles print job status tracking

## 🔄 Development Scripts

```bash
# Development
npm run dev              # Start both apps
npm run dev:backend     # Start backend only
npm run dev:frontend    # Start frontend only

# Production Build
npm run build           # Build both apps
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only

# Production Start
npm run start           # Start both apps in production
npm run start:backend   # Start backend in production
npm run start:frontend  # Start frontend in production

# Utilities
npm run lint            # Lint all workspaces
npm run test            # Test all workspaces
```

## 🌐 Network Access

To allow other devices on your LAN to access the printer server:

1. **Find your local IP address**:
   ```bash
   ipconfig
   ```

2. **Update the frontend API URL** in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001
   ```

3. **Start the applications**:
   ```bash
   npm run start
   ```

4. **Access from other devices**:
   - Open `http://YOUR_LOCAL_IP:3000` in any browser on your network

## 🔐 Security Considerations

- Currently designed for trusted local networks
- File uploads are validated for type and size
- Temporary files are automatically cleaned up
- Consider adding authentication for production use

## 🚀 Future Enhancements

- [ ] User authentication system
- [ ] Claude AI integration for document processing
- [ ] Print history and analytics
- [ ] Email notifications for print jobs
- [ ] Mobile app support
- [ ] Docker containerization
- [ ] Linux/macOS printer support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Printers not detected**:
   - Ensure printers are properly installed on Windows
   - Check printer drivers are up to date
   - Verify PowerShell execution policy allows scripts

2. **File upload fails**:
   - Check file size (max 50MB)
   - Verify file type is supported
   - Ensure uploads directory has write permissions

3. **Network access issues**:
   - Verify firewall settings allow connections
   - Check that both backend and frontend are accessible
   - Confirm correct IP addresses in configuration

### Support

For issues and questions:
- Check the troubleshooting section above
- Review the API documentation
- Check the console for error messages
- Ensure all dependencies are properly installed

---

Built with ❤️ using NestJS and Next.js for reliable, professional printer sharing on your local network.
