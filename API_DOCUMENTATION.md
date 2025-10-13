# LexChronos API Documentation

LexChronos is a comprehensive legal case management system with a robust RESTful API. This document provides detailed information about all available endpoints and their usage.

## Table of Contents

1. [Authentication](#authentication)
2. [Database Models](#database-models)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [Search & Filtering](#search--filtering)
7. [File Uploads](#file-uploads)
8. [Notifications](#notifications)
9. [Examples](#examples)

## Authentication

**Note**: Authentication is not yet implemented. This will be added in future versions with JWT-based authentication.

## Database Models

### Core Models

1. **Users** - Lawyers, paralegals, clients, and admin users
2. **Organizations** - Law firms and legal departments
3. **Cases** - Legal cases with comprehensive tracking
4. **Documents** - Legal documents with version control
5. **Timelines** - Case event timelines
6. **Deadlines** - Important legal deadlines
7. **BillingEntries** - Time tracking and expenses
8. **CourtDates** - Court hearings and appearances
9. **Evidence** - Case evidence with chain of custody
10. **Notes** - Case notes and documentation
11. **Notifications** - System notifications and reminders

## API Endpoints

### Health Check
- `GET /api/health` - API health status and database connectivity

### Users API
- `GET /api/users` - Get all users (paginated)
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Deactivate user

### Organizations API
- `GET /api/organizations` - Get all organizations (paginated)
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/[id]` - Get organization by ID
- `PUT /api/organizations/[id]` - Update organization
- `DELETE /api/organizations/[id]` - Deactivate organization

### Cases API
- `GET /api/cases` - Get all cases (paginated)
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case by ID with related data
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

### Documents API
- `GET /api/documents` - Get all documents (paginated)
- `POST /api/documents` - Create document metadata record
- `POST /api/documents/upload` - Upload document file
- `GET /api/documents/[id]/download` - Download document file

### Timelines API
- `GET /api/timelines` - Get timeline events (paginated)
- `POST /api/timelines` - Create new timeline event
- `POST /api/timelines/generate` - Auto-generate timeline for case
- `GET /api/timelines/generate/[caseId]` - Get generated timeline

### Billing API
- `GET /api/billing` - Get billing entries (paginated)
- `POST /api/billing` - Create new billing entry
- `POST /api/billing/calculations` - Calculate billing totals
- `GET /api/billing/calculations/summary` - Get billing summary

### Notifications API
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create new notification
- `PUT /api/notifications/mark-read` - Mark notifications as read
- `POST /api/notifications/generate` - Generate system notifications
- `GET /api/notifications/generate/preview` - Preview notifications

### Search API
- `GET /api/search` - Global search across entities
- `POST /api/search/advanced` - Advanced search with filters
- `GET /api/search/filters` - Get available filter options

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "pagination": {...} // For paginated endpoints
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE" // Optional error code
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

## Pagination

Paginated endpoints support these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Sort field (default: 'createdAt')
- `sortOrder` - Sort order: 'asc' or 'desc' (default: 'desc')

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Search & Filtering

### Global Search
```
GET /api/search?q=search_term&organizationId=123&categories=cases,documents
```

Supported categories:
- `cases`
- `documents`
- `users`
- `timelines`
- `notes`
- `evidence`
- `deadlines`

### Filtering Parameters

Most endpoints support filtering:
- `search` - Text search across relevant fields
- `organizationId` - Filter by organization
- `caseId` - Filter by case
- `userId` - Filter by user
- `status` - Filter by status
- `type` - Filter by type
- `startDate` / `endDate` - Date range filtering

## File Uploads

### Document Upload
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('title', 'Document Title');
formData.append('organizationId', '123');
formData.append('caseId', '456');
formData.append('uploadedById', '789');

fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});
```

### Upload Limitations
- Maximum file size: 10MB (configurable)
- Supported formats: PDF, DOC, DOCX, images, etc.
- Files are stored with checksums for integrity

## Notifications

### Notification Types
- `DEADLINE_REMINDER` - Upcoming deadlines
- `COURT_DATE` - Court appearances
- `TASK_ASSIGNMENT` - Task assignments
- `DOCUMENT_SHARED` - Document sharing
- `CASE_UPDATE` - Case updates
- `SYSTEM` - System notifications

### Generate Notifications
```javascript
POST /api/notifications/generate
{
  "organizationId": "123",
  "userId": "456", // Optional
  "types": ["DEADLINE_REMINDER", "COURT_DATE"]
}
```

## Examples

### Create a New Case
```javascript
POST /api/cases
{
  "caseNumber": "2024-CV-001",
  "title": "Smith vs. Johnson",
  "description": "Personal injury case",
  "type": "CIVIL",
  "clientName": "John Smith",
  "clientEmail": "john@example.com",
  "organizationId": "org-123",
  "assigneeId": "user-456"
}
```

### Search Cases
```javascript
GET /api/search?q=Smith&organizationId=org-123&categories=cases
```

### Upload Document
```javascript
// FormData upload
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'Motion to Dismiss');
formData.append('category', 'MOTION');
formData.append('organizationId', 'org-123');
formData.append('caseId', 'case-456');
formData.append('uploadedById', 'user-789');

POST /api/documents/upload
```

### Generate Timeline
```javascript
POST /api/timelines/generate
{
  "caseId": "case-123",
  "userId": "user-456"
}
```

### Calculate Billing
```javascript
POST /api/billing/calculations
{
  "organizationId": "org-123",
  "caseId": "case-456",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "groupBy": "user"
}
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EMAIL_SMTP_HOST=smtp.example.com
# ... other configuration options
```

## Development

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Setup database: `npx prisma migrate dev`
4. Generate Prisma client: `npx prisma generate`
5. Start development server: `npm run dev`

### Database Migration
```bash
npx prisma migrate dev --name migration_name
npx prisma db push  # For development
npx prisma generate # Update Prisma client
```

### Testing API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Get organizations
curl "http://localhost:3000/api/organizations?page=1&limit=5"
```

## Future Enhancements

- JWT Authentication & Authorization
- Document OCR Processing
- Email Notifications
- Push Notifications
- Advanced Search with Elasticsearch
- Audit Logging
- Report Generation
- Real-time Updates via WebSockets
- Mobile App API Support
- Third-party Integrations

## Support

For API support and documentation updates, please refer to the project repository or contact the development team.