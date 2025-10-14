# LexChronos Database Setup Guide

Complete database deployment for your Supabase project: **ouwobhnebqznsdtldozm**

## 🚀 Quick Setup (Supabase Dashboard)

### Step 1: Access Your Supabase Project
1. Go to: https://supabase.com/dashboard/project/ouwobhnebqznsdtldozm
2. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run Database Migrations

Copy and paste each SQL file in order:

#### Migration 1: Initial Schema
```sql
-- Copy and paste the contents of: supabase/migrations/001_initial_schema.sql
```

#### Migration 2: Row Level Security  
```sql
-- Copy and paste the contents of: supabase/migrations/002_row_level_security.sql
```

#### Migration 3: Triggers & Functions
```sql
-- Copy and paste the contents of: supabase/migrations/003_triggers_functions.sql
```

#### Step 3: Seed Sample Data
```sql
-- Copy and paste the contents of: supabase/seed.sql
```

## 📊 What Gets Created

### Core Tables
- **organizations** - Multi-tenant organization management
- **user_profiles** - Extended user information beyond Supabase auth
- **clients** - Client management (individuals & corporations)
- **practice_areas** - Legal practice area categorization
- **cases** - Legal case management with full lifecycle
- **documents** - Document management with OCR support
- **timeline_events** - Case timeline and milestone tracking

### Business Logic Tables
- **time_entries** - Time tracking for billing
- **invoices** - Invoice management and billing
- **tasks** - Task management and deadlines
- **conflict_entities** - Conflict of interest checking
- **trust_accounts** - Client trust fund management
- **trust_transactions** - Trust fund transaction tracking
- **notifications** - System notification management

### Sample Data Includes
- ✅ **Anderson Legal Group** demo organization
- ✅ **5 Practice Areas** (Corporate, Real Estate, Employment, IP, Litigation)
- ✅ **3 Sample Clients** (Individual & Corporate)
- ✅ **3 Active Cases** with different priorities
- ✅ **Timeline Events** and deadlines
- ✅ **Tasks** and assignments
- ✅ **Time Entries** for billing
- ✅ **Trust Account** with sample transactions

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ **Multi-tenant isolation** - Users only see their organization's data
- ✅ **Role-based access** - Admin vs user permissions
- ✅ **Secure functions** - Helper functions for organization access

### Automated Features
- ✅ **Auto-generated numbers** - Case, client, and invoice numbers
- ✅ **Timestamp tracking** - Created/updated timestamps
- ✅ **Balance calculations** - Trust account balance management
- ✅ **Notification system** - Automated deadline and assignment alerts

## 🔧 Advanced Features

### Database Functions
- `get_user_organization_id()` - Get current user's organization
- `is_user_admin()` - Check admin privileges  
- `search_cases()` - Full-text case search
- `check_approaching_deadlines()` - Deadline notification system

### Triggers
- Auto-update timestamps on record changes
- Auto-generate case/client/invoice numbers
- Trust account balance calculations
- Case assignment notifications
- Task completion on case closure

## 🌐 Connection Details

**Your Supabase Project:**
- **URL**: https://ouwobhnebqznsdtldozm.supabase.co
- **Project ID**: ouwobhnebqznsdtldozm
- **Database**: PostgreSQL with full SQL support

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ouwobhnebqznsdtldozm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[password]@db.ouwobhnebqznsdtldozm.supabase.co:5432/postgres
```

## ✅ Verification

After running all migrations, you should see:
- **13 tables** created successfully
- **Sample data** populated
- **RLS policies** active
- **Triggers** and functions working

Run this query to verify:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 🚀 Ready for Production

Your database is now configured for:
- ✅ **Multi-tenant SaaS** architecture
- ✅ **Enterprise security** with RLS
- ✅ **Automated business logic**
- ✅ **Full legal case management**
- ✅ **Real-time subscriptions** ready
- ✅ **Scalable performance** with indexes

Perfect for your LexChronos legal case management platform! 🏛️⚖️