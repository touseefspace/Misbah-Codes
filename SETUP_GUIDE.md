# Setup Guide - Misbah Fruits and Vegetables

This guide will walk you through setting up the complete system from scratch.

---

## Step 1: Supabase Database Setup

### 1.1 Run the Migration

1. **Log in to your Supabase project**
   - Go to https://supabase.com/dashboard
   - Select your project: `hdygunjweicwgbpkalnk`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the migration**
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify tables were created**
   - Click on "Table Editor" in the left sidebar
   - You should see all tables: users, branches, entities, products, etc.

### 1.2 Configure Supabase Auth (Optional)

Since we're using Clerk for authentication, we don't need to configure Supabase Auth. However, we need to ensure RLS policies work correctly.

**Important:** The RLS policies use `auth.uid()` which returns the authenticated user's ID. When making requests from the client, you'll need to set the Supabase client's JWT to the Clerk user ID.

---

## Step 2: Clerk Webhook Setup

### 2.1 Create the Webhook Endpoint

The webhook endpoint is already created in this guide. We'll create it at:
`app/api/webhooks/clerk/route.ts`

### 2.2 Deploy Your Application (or use ngrok for local testing)

**Option A: Deploy to Vercel (Recommended)**

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Option B: Local testing with ngrok**

1. Install ngrok: `npm install -g ngrok`
2. Run your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 2.3 Configure Webhook in Clerk

1. **Go to Clerk Dashboard**
   - Visit https://dashboard.clerk.com
   - Select your application

2. **Navigate to Webhooks**
   - Click "Webhooks" in the left sidebar
   - Click "Add Endpoint"

3. **Configure the webhook**
   - **Endpoint URL:** `https://your-domain.com/api/webhooks/clerk` (or ngrok URL)
   - **Subscribe to events:**
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
   - Click "Create"

4. **Copy the Signing Secret**
   - After creating, you'll see a "Signing Secret"
   - Copy it (looks like `whsec_...`)
   - Add to your `.env.local`:
     ```
     CLERK_WEBHOOK_SECRET=whsec_your_secret_here
     ```

### 2.4 Test the Webhook

1. Create a test user in Clerk
2. Check Supabase `users` table - the user should appear with:
   - `role = 'pending'`
   - `is_approved = false`

---

## Step 3: Create First Admin User

### 3.1 Sign Up via Clerk

1. Go to your app: `http://localhost:3000` or your deployed URL
2. Click "Sign Up"
3. Create account with your email

### 3.2 Promote to Admin in Supabase

Since the first user needs to be an admin, we'll manually update the database:

1. **Go to Supabase Table Editor**
2. **Open `users` table**
3. **Find your user** (by email)
4. **Edit the row:**
   - Set `role` to `admin`
   - Set `is_approved` to `true`
   - Set `branch_id` to the admin branch ID (get from `branches` table)
5. **Save**

Now you can log in as admin!

---

## Step 4: Supabase Client Configuration

### 4.1 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 4.2 Create Supabase Client Utility

We'll create a utility to initialize Supabase with Clerk authentication.

**File: `lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hook to create authenticated Supabase client
export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  const getAuthenticatedClient = async () => {
    const token = await getToken({ template: 'supabase' })
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }
  
  return { getAuthenticatedClient }
}
```

### 4.3 Configure Clerk JWT Template

To make Clerk tokens work with Supabase RLS:

1. **Go to Clerk Dashboard**
2. **Navigate to JWT Templates**
   - Click "JWT Templates" in left sidebar
   - Click "New template"
   - Select "Supabase"

3. **Configure the template**
   - Name: `supabase`
   - Copy your Supabase JWT Secret from Supabase Settings > API
   - Save

4. **Update Clerk user ID to match Supabase**

   When creating users via webhook, we use Clerk's user ID as the primary key in Supabase.

---

## Step 5: Environment Variables Setup

Ensure your `.env.local` has all required variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SECRET_KEY=sb_secret_...

# Application Config
NEXT_PUBLIC_CURRENCY=AED
```

---

## Step 6: Testing the Setup

### 6.1 Test User Creation

1. Sign up a new user
2. Check Supabase `users` table - should see new user with `role = 'pending'`
3. As admin, approve the user (we'll build this UI later)

### 6.2 Test Role-Based Access

1. Log in as admin
2. Try accessing `/admin/dashboard` - should work
3. Log out and log in as pending user
4. Try accessing `/admin/dashboard` - should redirect

### 6.3 Test RLS Policies

1. As admin, create a product
2. As salesman, try to view products - should work
3. As salesman, try to create a product - should fail

---

## Step 7: Next Steps

After completing the setup:

1. ✅ Clerk authentication is working
2. ✅ Supabase database is configured
3. ✅ User sync via webhook is working
4. ✅ First admin user is created

**Next development tasks:**

1. **Build middleware for route protection** (already in `proxy.ts`, needs enhancement)
2. **Create admin user approval page** (`app/admin/users/page.tsx`)
3. **Build product management** (CRUD operations)
4. **Create shared UI components** (Sidebar, Header, DataTable, etc.)
5. **Implement dashboard** with stats
6. **Build transaction flows** (sales, purchases)

Refer to `IMPLEMENTATION_PLAN.md` for the complete sprint breakdown.

---

## Troubleshooting

### Webhook Not Working

**Problem:** Users created in Clerk don't appear in Supabase

**Solutions:**
1. Check webhook URL is correct and accessible
2. Verify signing secret matches in `.env.local`
3. Check webhook logs in Clerk dashboard
4. Check your API route logs for errors

### RLS Policies Blocking Everything

**Problem:** Can't access any data even as admin

**Solutions:**
1. Verify user exists in `users` table
2. Check `role = 'admin'` and `is_approved = true`
3. Ensure Clerk JWT template is configured for Supabase
4. Check that `auth.uid()` returns the correct user ID
5. Temporarily disable RLS for debugging:
   ```sql
   ALTER TABLE products DISABLE ROW LEVEL SECURITY;
   ```

### Can't Create First Admin

**Problem:** Chicken-and-egg problem - need admin to approve users, but no admin exists

**Solution:**
- Manually update the first user in Supabase dashboard as shown in Step 3.2

### Migration Errors

**Problem:** SQL migration fails to run

**Solutions:**
1. Drop all tables and re-run (⚠️ ONLY for fresh setup)
2. Check for syntax errors
3. Run in sections if needed
4. Check Supabase logs for specific errors

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel/hosting platform
- [ ] Webhook endpoint is using production URL
- [ ] Database is backed up
- [ ] RLS policies are enabled and tested
- [ ] First admin user is created
- [ ] Error tracking is set up (e.g., Sentry)
- [ ] Database connection pooling is configured
- [ ] API rate limiting is implemented
- [ ] HTTPS is enforced
- [ ] CORS is properly configured

---

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`, keep it that way
2. **Use RLS policies** - Don't bypass them in production
3. **Validate webhook signatures** - Always verify Clerk webhook signatures
4. **Sanitize user inputs** - Use prepared statements (Supabase does this automatically)
5. **Rotate secrets regularly** - Especially Clerk and Supabase keys
6. **Monitor database** - Set up alerts for unusual activity
7. **Audit logs** - Use `created_by` fields to track who did what

---

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need help?** Contact the development team or refer to the implementation plan.
