# Administrator Dashboard Guide

Complete guide to using the LexChronos administrative interface for system administrators and practice managers.

## 📋 Table of Contents

1. [Admin Dashboard Overview](#admin-dashboard-overview)
2. [Organization Management](#organization-management)
3. [User Administration](#user-administration)
4. [System Settings](#system-settings)
5. [Analytics & Reporting](#analytics--reporting)
6. [Security Management](#security-management)
7. [Troubleshooting](#troubleshooting)

## 🏠 Admin Dashboard Overview

### Accessing Admin Features

**Admin Access Requirements:**
- User role: `ADMIN` or `MANAGING_PARTNER`
- Active organization membership
- Two-factor authentication enabled (recommended)

**Navigation:**
- Admin panel available at `/admin`
- Admin menu appears in top navigation for admin users
- Quick access widgets on main dashboard

### Dashboard Sections

**System Overview Widget**
```
📊 System Health
├── 🟢 API Response Time: 45ms
├── 🟢 Database: Connected
├── 🟢 Redis Cache: Active
├── 🟡 Storage: 78% used
└── 🟢 External Services: Operational

📈 Usage Statistics (Last 30 Days)
├── Active Users: 156 (+12%)
├── New Cases: 89 (+7%)
├── Documents Uploaded: 1,247 (+23%)
└── Billable Hours: 2,156 hrs
```

**Quick Actions Panel**
- Add New User
- Create Organization
- View System Logs
- Generate Reports
- Backup Data
- System Maintenance

## 🏢 Organization Management

### Organization Dashboard

**Organization Information**
```
Organization: Smith & Associates Law Firm
Type: Law Firm
Status: Active
Subscription: Professional
Users: 25/50
Storage Used: 15.7 GB / 100 GB
```

### Managing Organization Details

1. **Basic Information**
   - Organization name and type
   - Contact information
   - Physical address
   - Website and social media

2. **Legal Information**
   - Tax ID and business license
   - Bar association memberships
   - Professional liability insurance
   - Regulatory compliance status

3. **Subscription Management**
   - Current plan and features
   - Usage limits and quotas
   - Billing history
   - Upgrade/downgrade options

### Multi-Organization Management

**For System Administrators:**
```sql
-- View all organizations
SELECT 
  id,
  name,
  type,
  subscription_tier,
  user_count,
  created_at,
  is_active
FROM organizations
ORDER BY created_at DESC;
```

**Organization Actions:**
- Create new organization
- Suspend/activate organization
- Transfer users between organizations
- Merge organizations
- Delete organization (with data export)

## 👥 User Administration

### User Management Dashboard

**User Overview Table**
| Name | Email | Role | Status | Last Login | Actions |
|------|-------|------|--------|------------|---------|
| John Smith | john@firm.com | Lawyer | Active | 2 hours ago | Edit / Suspend |
| Jane Doe | jane@firm.com | Paralegal | Active | 1 day ago | Edit / Reset Password |
| Bob Johnson | bob@firm.com | Admin | Inactive | 1 week ago | Edit / Activate |

### User Account Management

1. **Creating New Users**
   ```typescript
   // Admin form for creating users
   const createUser = {
     email: 'newuser@firm.com',
     firstName: 'New',
     lastName: 'User',
     role: 'LAWYER',
     department: 'Litigation',
     hourlyRate: 350,
     permissions: ['READ_CASES', 'CREATE_CASES']
   }
   ```

2. **User Roles and Permissions**
   ```
   ADMIN
   ├── Full system access
   ├── User management
   ├── Organization settings
   ├── Billing management
   └── System configuration
   
   MANAGING_PARTNER
   ├── Organization management
   ├── User supervision
   ├── Financial reports
   └── Client management
   
   LAWYER
   ├── Case management
   ├── Document access
   ├── Time tracking
   └── Client communication
   
   PARALEGAL
   ├── Case support
   ├── Document management
   ├── Calendar management
   └── Limited financial access
   ```

3. **User Status Management**
   - Active: Full system access
   - Inactive: Login disabled, data preserved
   - Suspended: Temporary access restriction
   - Pending: Invitation sent, not yet activated

### Bulk User Operations

**Import Users from CSV**
```csv
email,firstName,lastName,role,department,hourlyRate
john.doe@firm.com,John,Doe,LAWYER,Corporate,400
jane.smith@firm.com,Jane,Smith,PARALEGAL,Litigation,75
```

**User Data Export**
- Export user list with filters
- Include activity statistics
- Compliance reporting
- Audit trail export

## ⚙️ System Settings

### General Settings

1. **Application Configuration**
   ```json
   {
     "organizationName": "Smith & Associates",
     "timezone": "America/New_York",
     "dateFormat": "MM/DD/YYYY",
     "timeFormat": "12-hour",
     "currency": "USD",
     "language": "en-US"
   }
   ```

2. **Security Settings**
   ```json
   {
     "passwordPolicy": {
       "minLength": 8,
       "requireUppercase": true,
       "requireNumbers": true,
       "requireSpecialChars": true,
       "maxAge": 90
     },
     "sessionTimeout": 480,
     "mfaRequired": false,
     "ipWhitelist": ["192.168.1.0/24"]
   }
   ```

3. **Feature Flags**
   - Document collaboration
   - Real-time notifications
   - Advanced analytics
   - Mobile app access
   - API access

### Email Configuration

**SMTP Settings**
```
SMTP Server: smtp.office365.com
Port: 587
Security: STARTTLS
Username: noreply@yourfirm.com
Authentication: OAuth2 / Password
```

**Email Templates**
- Welcome email for new users
- Password reset notifications
- Deadline reminders
- System maintenance alerts
- Invoice notifications

### File Storage Configuration

**Storage Options**
1. **Local Storage** (Default)
   - Path: `/var/lib/lexchrono/uploads`
   - Max file size: 100MB
   - Allowed types: PDF, DOC, DOCX, etc.

2. **Cloud Storage** (AWS S3)
   - Bucket: `your-firm-documents`
   - Region: `us-east-1`
   - Encryption: AES-256
   - Lifecycle policies: Archive after 1 year

## 📊 Analytics & Reporting

### System Analytics Dashboard

**User Activity Metrics**
```
Daily Active Users (Last 30 Days)
┌─────────────────────────────────────┐
│ ▄▄▄ ▄▄▄▄ ▄▄▄▄▄ ▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄   │
│ ███ ████ █████ ███ ███████ ████   │
│ ███ ████ █████ ███ ███████ ████   │
└─────────────────────────────────────┘
Average: 42 users/day (+15% vs last month)
```

**Performance Metrics**
- Average response time: 287ms
- Error rate: 0.12%
- Uptime: 99.97%
- Cache hit rate: 94.2%

**Usage Statistics**
- Total cases: 1,247
- Documents uploaded: 15,678
- Billable hours logged: 8,945
- Revenue tracked: $2,156,789

### Custom Reports

**Available Report Types**
1. **User Activity Report**
   - Login frequency
   - Feature usage
   - Time spent in application
   - Device/browser breakdown

2. **Case Management Report**
   - Cases by status
   - Cases by type
   - Average case duration
   - Assignment distribution

3. **Financial Report**
   - Billable hours by user
   - Revenue by case type
   - Collection rates
   - Profitability analysis

4. **Security Report**
   - Failed login attempts
   - Permission changes
   - Data access patterns
   - Compliance violations

### Report Generation

**Schedule Automated Reports**
```javascript
// Weekly executive summary
const weeklyReport = {
  name: 'Weekly Executive Summary',
  schedule: '0 9 * * 1', // Every Monday at 9 AM
  recipients: ['managing.partner@firm.com'],
  sections: [
    'user_activity',
    'case_summary',
    'financial_overview',
    'system_health'
  ]
}
```

## 🔒 Security Management

### Access Control

**Permission Matrix**
| Resource | Admin | Manager | Lawyer | Paralegal | Client |
|----------|-------|---------|--------|-----------|--------|
| Cases | CRUD | CRUD | CRUD | RU | R |
| Documents | CRUD | CRUD | CRUD | CRUD | R |
| Users | CRUD | RU | R | R | - |
| Reports | CRUD | R | R | R | - |
| Settings | CRUD | RU | - | - | - |

**Advanced Security Features**
1. **IP Address Restrictions**
   - Whitelist trusted IP ranges
   - Block suspicious locations
   - VPN detection and blocking

2. **Session Management**
   - Maximum concurrent sessions
   - Session timeout policies
   - Force logout all sessions

3. **Audit Logging**
   - All user actions logged
   - Data access tracking
   - Permission changes
   - System modifications

### Security Monitoring

**Real-time Alerts**
- Multiple failed login attempts
- Unusual data access patterns
- Permission escalation attempts
- Large data downloads
- After-hours access

**Security Dashboard**
```
🔒 Security Status: HEALTHY

Recent Alerts (Last 24 Hours)
├── 🟡 3 failed login attempts (user: john@firm.com)
├── 🟢 Successful password reset (user: jane@firm.com)
└── 🟢 Normal access patterns detected

System Security Score: 94/100
├── ✅ SSL Certificate: Valid
├── ✅ Security Headers: Configured
├── ✅ Database Encryption: Active
└── ⚠️ MFA Adoption: 67% (Target: 90%)
```

## 🔧 Troubleshooting

### Common Admin Issues

1. **User Cannot Access System**
   ```
   Troubleshooting Steps:
   1. Check user status (Active/Inactive/Suspended)
   2. Verify organization membership
   3. Check password reset requirements
   4. Review IP whitelist restrictions
   5. Verify email address confirmation
   ```

2. **Performance Issues**
   ```
   Performance Checklist:
   1. Check database connection pool
   2. Monitor Redis cache hit rate
   3. Review error logs for bottlenecks
   4. Check storage space availability
   5. Monitor concurrent user count
   ```

3. **Email Delivery Problems**
   ```
   Email Troubleshooting:
   1. Verify SMTP configuration
   2. Check email template syntax
   3. Review spam/blacklist status
   4. Test with different email providers
   5. Check email queue status
   ```

### System Maintenance

**Regular Maintenance Tasks**
- Weekly database optimization
- Monthly user account cleanup
- Quarterly security review
- Annual compliance audit

**Maintenance Mode**
```bash
# Enable maintenance mode
curl -X POST /api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true, "message": "System maintenance in progress"}'

# Disable maintenance mode
curl -X POST /api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}'
```

**Database Maintenance**
```sql
-- Run during maintenance window
VACUUM ANALYZE;
REINDEX DATABASE lexchrono;
UPDATE pg_stat_statements_reset();
```

### Emergency Procedures

**System Outage Response**
1. Check system health dashboard
2. Review error logs and metrics
3. Verify external service status
4. Contact technical support if needed
5. Communicate with users about issues

**Data Recovery**
1. Identify affected data scope
2. Check backup availability
3. Coordinate with technical team
4. Execute recovery procedure
5. Verify data integrity post-recovery

---

This admin guide provides comprehensive coverage of administrative functions while maintaining security and operational best practices for legal practice management.