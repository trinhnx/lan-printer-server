# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a LAN Printer Server application built with NestJS backend and Next.js frontend. The application allows users on a local network to upload files and print them through a centralized printer server.

## Architecture
- **Backend**: NestJS with TypeScript
  - File upload handling with Multer
  - Printer integration using Windows PowerShell commands
  - RESTful API endpoints for print jobs and file management
  - Real-time print job status tracking

- **Frontend**: Next.js with TypeScript and Tailwind CSS
  - Drag & drop file upload interface
  - Real-time printer status monitoring
  - Print job queue management
  - Responsive design for multiple devices

## Key Technologies
- NestJS for robust backend API
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Multer for file uploads
- Windows PowerShell for printer integration

## Folder Structure
- `apps/backend/` - NestJS backend application
- `apps/frontend/` - Next.js frontend application
- `packages/` - Shared packages (future use)

## Development Guidelines
- Use TypeScript strict mode
- Follow NestJS best practices for modules, controllers, and services
- Use React hooks and functional components
- Implement proper error handling and loading states
- Maintain consistent code formatting with Prettier and ESLint

## API Endpoints
- `GET /api/print/printers` - Get available printers
- `POST /api/print/upload-and-print` - Upload file and print
- `GET /api/print/jobs` - Get all print jobs
- `GET /api/files` - Get uploaded files
- `GET /api/health` - Server health check

## Future Enhancements
- User authentication system
- Claude AI integration for document processing
- Multiple printer support
- Print history management
- Mobile app support
