# API Reference

Complete reference for the LexChronos REST API and WebSocket events.

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Core Resources](#core-resources)
5. [WebSocket Events](#websocket-events)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)
8. [SDKs & Examples](#sdks--examples)

## 🌐 API Overview

### Base URL
```
Production: https://api.lexchronos.com
Staging: https://staging-api.lexchronos.com
Development: http://localhost:3000/api
```

### API Version
Current version: `v1`

All API endpoints are prefixed with `/api/` for Next.js API routes.

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

### HTTP Methods
- `GET` - Retrieve data
- `POST` - Create new resources
- `PUT` - Update existing resources
- `PATCH` - Partial updates
- `DELETE` - Remove resources

## 🔐 Authentication

### JWT Bearer Token

All API requests require authentication via JWT bearer token:

```http
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "LAWYER",
      "organizationId": "org_456"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

## ❌ Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Validation Error |
| `429` | Rate Limited |
| `500` | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## 📊 Core Resources

### Cases API

#### List Cases
```http
GET /api/cases
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?status=ACTIVE&type=CIVIL&assignee=user_123&page=1&limit=20&search=smith
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "id": "case_123",
        "caseNumber": "2024-001",
        "title": "Smith v. ABC Insurance",
        "type": "PERSONAL_INJURY",
        "status": "ACTIVE",
        "priority": "HIGH",
        "clientName": "John Smith",
        "clientEmail": "john@example.com",
        "assignee": {
          "id": "user_456",
          "firstName": "Jane",
          "lastName": "Attorney"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Get Case
```http
GET /api/cases/{caseId}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case_123",
    "caseNumber": "2024-001",
    "title": "Smith v. ABC Insurance",
    "description": "Motor vehicle accident case...",
    "type": "PERSONAL_INJURY",
    "status": "ACTIVE",
    "priority": "HIGH",
    "clientName": "John Smith",
    "clientEmail": "john@example.com",
    "clientPhone": "+1-555-0123",
    "court": "Superior Court of California",
    "judge": "Hon. Sarah Johnson",
    "opposingParty": "ABC Insurance Company",
    "opposingCounsel": "Defense Attorney",
    "filingDate": "2024-01-01T00:00:00Z",
    "estimatedValue": 150000,
    "hourlyRate": 350,
    "assignee": {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Attorney",
      "email": "jane@lawfirm.com"
    },
    "organization": {
      "id": "org_789",
      "name": "Smith & Associates"
    },
    "tags": ["motor-vehicle", "insurance", "personal-injury"],
    "customFields": {
      "accidentDate": "2023-12-15",
      "policyNumber": "POL-123456"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

#### Create Case
```http
POST /api/cases
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "New Case Title",
  "type": "CIVIL",
  "clientName": "Client Name",
  "clientEmail": "client@example.com",
  "description": "Case description...",
  "priority": "MEDIUM",
  "estimatedValue": 100000,
  "hourlyRate": 300
}
```

#### Update Case
```http
PUT /api/cases/{caseId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Case Title",
  "status": "ACTIVE",
  "priority": "HIGH"
}
```

#### Delete Case
```http
DELETE /api/cases/{caseId}
Authorization: Bearer <jwt_token>
```

### Documents API

#### List Documents
```http
GET /api/documents
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?caseId=case_123&category=PLEADING&search=motion&page=1&limit=20
```

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: <file>
caseId: case_123
category: PLEADING
description: Motion for Summary Judgment
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc_456",
    "title": "Motion for Summary Judgment",
    "fileName": "motion-summary-judgment.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "category": "PLEADING",
    "uploadedBy": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Attorney"
    },
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

#### Download Document
```http
GET /api/documents/{documentId}/download
Authorization: Bearer <jwt_token>
```

**Response:** Binary file stream with appropriate headers.

### Timeline API

#### Get Case Timeline
```http
GET /api/timelines?caseId=case_123
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "timeline_789",
        "title": "Case Filed",
        "description": "Initial complaint filed with court",
        "eventType": "FILING",
        "eventDate": "2024-01-01T09:00:00Z",
        "importance": "HIGH",
        "location": "Superior Court",
        "participants": ["Attorney", "Client"],
        "createdBy": {
          "id": "user_123",
          "firstName": "John",
          "lastName": "Attorney"
        },
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

#### Generate AI Timeline
```http
POST /api/timelines/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "caseId": "case_123",
  "documentIds": ["doc_456", "doc_789"]
}
```

### Billing API

#### List Time Entries
```http
GET /api/timeentries
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?caseId=case_123&userId=user_456&startDate=2024-01-01&endDate=2024-01-31
```

#### Create Time Entry
```http
POST /api/timeentries
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "caseId": "case_123",
  "description": "Research motion precedents",
  "hours": 2.5,
  "date": "2024-01-15",
  "task": "RESEARCH",
  "billable": true,
  "hourlyRate": 350
}
```

#### Generate Invoice
```http
POST /api/invoices
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "caseId": "case_123",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "includeExpenses": true
}
```

## 🔌 WebSocket Events

### Connection
```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
})
```

### Case Events

#### Join Case Room
```javascript
socket.emit('case:join', caseId)
```

#### Listen for Case Updates
```javascript
socket.on('case:updated', (updatedCase) => {
  console.log('Case updated:', updatedCase)
})
```

#### Send Case Update
```javascript
socket.emit('case:update', {
  caseId: 'case_123',
  updates: {
    title: 'Updated Title',
    priority: 'HIGH'
  }
})
```

### Document Collaboration

#### Join Document Session
```javascript
socket.emit('document:join', documentId)
```

#### Send Document Edit
```javascript
socket.emit('document:edit', {
  documentId: 'doc_456',
  operation: {
    type: 'insert',
    position: 100,
    content: 'New text content'
  }
})
```

#### Receive Document Updates
```javascript
socket.on('document:updated', (edit) => {
  // Apply edit to document
  applyEdit(edit)
})
```

### Notifications

#### Receive Notifications
```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification)
  // Display notification to user
})
```

#### Mark Notification as Read
```javascript
socket.emit('notification:mark_read', notificationId)
```

### Presence

#### Update User Status
```javascript
socket.emit('presence:update', {
  status: 'online',
  activity: 'Working on case ABC-123'
})
```

#### Listen for User Status Changes
```javascript
socket.on('user:online', (userId) => {
  console.log(`User ${userId} is now online`)
})

socket.on('user:offline', (userId) => {
  console.log(`User ${userId} is now offline`)
})
```

## 🚦 Rate Limiting

### Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|---------|
| Authentication | 5 requests | 15 minutes |
| API Endpoints | 100 requests | 15 minutes |
| File Upload | 10 requests | 15 minutes |
| Search | 50 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 900
  }
}
```

## 🔗 Webhooks

### Webhook Configuration

```http
POST /api/webhooks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/lexchronos",
  "events": ["case.created", "case.updated", "document.uploaded"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

#### Case Created
```json
{
  "event": "case.created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "case": {
      "id": "case_123",
      "title": "New Case",
      "organizationId": "org_456"
    }
  }
}
```

#### Document Uploaded
```json
{
  "event": "document.uploaded",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "document": {
      "id": "doc_789",
      "title": "New Document",
      "caseId": "case_123"
    }
  }
}
```

### Webhook Verification

Verify webhook signatures using HMAC SHA-256:

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const digest = hmac.digest('hex')
  
  return signature === `sha256=${digest}`
}
```

## 📚 SDKs & Examples

### JavaScript/TypeScript SDK

```bash
npm install @lexchronos/sdk
```

```typescript
import { LexChronosClient } from '@lexchronos/sdk'

const client = new LexChronosClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.lexchronos.com'
})

// List cases
const cases = await client.cases.list({
  status: 'ACTIVE',
  limit: 20
})

// Create case
const newCase = await client.cases.create({
  title: 'New Case',
  clientName: 'John Doe',
  type: 'CIVIL'
})

// Upload document
const document = await client.documents.upload({
  file: fileBuffer,
  caseId: 'case_123',
  category: 'PLEADING'
})
```

### Python SDK

```bash
pip install lexchronos-python
```

```python
from lexchronos import LexChronosClient

client = LexChronosClient(
    api_key='your-api-key',
    base_url='https://api.lexchronos.com'
)

# List cases
cases = client.cases.list(status='ACTIVE', limit=20)

# Create case
new_case = client.cases.create({
    'title': 'New Case',
    'client_name': 'John Doe',
    'type': 'CIVIL'
})
```

### cURL Examples

#### List Cases
```bash
curl -X GET "https://api.lexchronos.com/api/cases" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Create Case
```bash
curl -X POST "https://api.lexchronos.com/api/cases" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Case Title",
    "type": "CIVIL",
    "clientName": "Client Name"
  }'
```

#### Upload Document
```bash
curl -X POST "https://api.lexchronos.com/api/documents/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "caseId=case_123" \
  -F "category=PLEADING"
```

## 🔍 Search API

### Global Search
```http
GET /api/search
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?q=search+term&filters[type]=cases&filters[status]=active&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "case",
        "id": "case_123",
        "title": "Smith v. ABC Insurance",
        "snippet": "Motor vehicle accident involving...",
        "score": 0.95
      },
      {
        "type": "document",
        "id": "doc_456",
        "title": "Motion for Summary Judgment",
        "snippet": "Plaintiff respectfully requests...",
        "score": 0.87
      }
    ],
    "facets": {
      "type": {
        "cases": 15,
        "documents": 8,
        "contacts": 3
      },
      "status": {
        "active": 20,
        "closed": 6
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 26
    }
  }
}
```

### Advanced Search Filters
```http
GET /api/search/filters
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "availableFilters": {
      "caseTypes": ["CIVIL", "CRIMINAL", "FAMILY"],
      "caseStatuses": ["ACTIVE", "CLOSED", "PENDING"],
      "documentCategories": ["PLEADING", "MOTION", "BRIEF"],
      "dateRanges": ["last_week", "last_month", "last_year"]
    }
  }
}
```

This API reference provides comprehensive documentation for integrating with LexChronos. For additional examples and advanced usage, refer to the [SDKs documentation](./sdks.md) and [integration guides](../admin/integrations.md).