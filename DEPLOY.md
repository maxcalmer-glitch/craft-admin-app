# CRAFT Admin Panel V3 - Deployment Guide

## 🚀 Vercel Deployment

### 1. Import project in Vercel
- Go to https://vercel.com/new
- Import from GitHub: `maxcalmer-glitch/craft-admin-v3`
- Framework: Next.js

### 2. Set Environment Variables in Vercel:
Copy the same Supabase credentials from craft-main-app Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` = craft-admin-v3-enterprise-secret-2026-xK9mP2nQ
- `TELEGRAM_BOT_TOKEN` = (same bot token as main app)
- `NEXT_PUBLIC_APP_URL` = https://craft-admin-v3.vercel.app

### 3. Run Database Migration
Execute `migration.sql` in Supabase SQL Editor to create:
- `admin_audit_log` table
- `broadcast_history` table

### 4. Login Credentials
- admin / craft2026!
- maksym / max2026!CRAFT
