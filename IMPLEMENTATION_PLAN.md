# Misbah Fruits and Vegetables - Implementation Plan

## Project Overview

A comprehensive internal management system for **Misbah Fruits and Vegetables** to track purchases, sales, inventory, customer/supplier ledgers, and generate financial reports across multiple branches.

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Authentication:** Clerk (with keyless mode)
- **Database:** Supabase (PostgreSQL)
- **Currency:** AED (configurable via environment variable)

---

## Phase 1: Clerk Setup & Project Bootstrap ✓ (In Progress)

### 1.1 Clerk Authentication Setup ✓
- [x] Install Clerk SDK (`@clerk/nextjs`)
- [x] Configure environment variables (CLERK keys)
- [x] Set up `proxy.ts` middleware with `clerkMiddleware()`
- [x] Wrap app with `<ClerkProvider>` in `app/layout.tsx`

### 1.2 Clerk-Supabase Integration (PENDING)

**Problem:** Users signing up via Clerk don't automatically create records in Supabase.

**Solution:**
1. **Create Supabase `users` table** with Clerk user ID as the primary key
2. **Set up Clerk Webhooks** to sync user data to Supabase:
   - Listen for `user.created` event
   - Create corresponding user record in Supabase
   - Set `is_approved = false` by default
   - Assign `role = 'pending'`
3. **Create Admin Approval Flow:**
   - Admin dashboard to view pending users
   - Approve/reject with role assignment (admin/salesman)
   - Update `is_approved` and `role` in Supabase

### 1.3 Role-Based Access Control (RBAC)

**Implementation Strategy:**
1. **Store user metadata in Supabase:**
   - `user_id` (Clerk ID)
   - `email`
   - `role` (admin | salesman | pending)
   - `is_approved` (boolean)
   - `branch_id` (for salesmen)
   - `created_at`, `updated_at`

2. **Middleware protection:**
   - Check if user exists in Supabase
   - Verify `is_approved = true`
   - Route protection based on role:
     - `/admin/*` → admin only
     - `/salesman/*` → salesman only
     - Redirect pending users to `/pending-approval` page

3. **Data-level access control (Row Level Security in Supabase):**
   - Admin: Full access to all data
   - Salesman: Only their branch + admin branch

---

## Phase 2: Supabase Setup & Core System Design

### 2.1 Database Schema Design

#### Core Tables

**1. users**
```sql
- id (uuid, primary key) -- Clerk user ID
- email (text, unique, not null)
- full_name (text)
- role (enum: 'admin', 'salesman', 'pending')
- is_approved (boolean, default false)
- branch_id (uuid, foreign key to branches)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**2. branches**
```sql
- id (uuid, primary key, default gen_random_uuid())
- name (text, not null)
- location (text)
- is_admin_branch (boolean, default false)
- created_at (timestamptz)
```

**3. entities** (Customers & Suppliers)
```sql
- id (uuid, primary key, default gen_random_uuid())
- name (text, not null)
- type (enum: 'customer', 'supplier')
- phone (text)
- location (text)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**4. products**
```sql
- id (uuid, primary key, default gen_random_uuid())
- name (text, unique, not null)
- description (text)
- -- Cost prices (purchase price)
- cost_price_carton (decimal(10,2))
- cost_price_tray (decimal(10,2))
- cost_price_kg (decimal(10,2))
- -- Selling prices
- selling_price_carton (decimal(10,2))
- selling_price_tray (decimal(10,2))
- selling_price_kg (decimal(10,2))
- -- Conversion ratios
- kg_per_tray (decimal(10,3))
- tray_per_carton (integer)
- kg_per_carton (decimal(10,3))
- created_at (timestamptz)
- updated_at (timestamptz)
```

**5. transactions** (Sales & Purchases)
```sql
- id (uuid, primary key, default gen_random_uuid())
- type (enum: 'sale', 'purchase')
- entity_id (uuid, foreign key to entities)
- branch_id (uuid, foreign key to branches)
- total_amount (decimal(10,2), not null)
- paid_amount (decimal(10,2), default 0)
- balance (decimal(10,2), generated as total_amount - paid_amount)
- notes (text)
- created_by (uuid, foreign key to users)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**6. transaction_items**
```sql
- id (uuid, primary key, default gen_random_uuid())
- transaction_id (uuid, foreign key to transactions)
- product_id (uuid, foreign key to products)
- unit (enum: 'carton', 'tray', 'kg')
- quantity (decimal(10,3), not null)
- cost_price (decimal(10,2)) -- For purchases and profit calculation
- selling_price (decimal(10,2)) -- For sales
- amount (decimal(10,2), not null) -- quantity * price
- profit (decimal(10,2)) -- For sales: (selling_price - cost_price) * quantity
```

**7. payments** (Ledger entries)
```sql
- id (uuid, primary key, default gen_random_uuid())
- entity_id (uuid, foreign key to entities)
- transaction_id (uuid, foreign key to transactions, nullable)
- branch_id (uuid, foreign key to branches)
- amount (decimal(10,2), not null)
- payment_type (enum: 'debit', 'credit') -- debit = payment received/made, credit = new balance
- balance_before (decimal(10,2))
- balance_after (decimal(10,2))
- notes (text)
- created_by (uuid, foreign key to users)
- created_at (timestamptz)
```

**8. inventory**
```sql
- id (uuid, primary key, default gen_random_uuid())
- branch_id (uuid, foreign key to branches)
- product_id (uuid, foreign key to products)
- quantity_carton (decimal(10,3), default 0)
- quantity_tray (decimal(10,3), default 0)
- quantity_kg (decimal(10,3), default 0)
- last_updated (timestamptz)
- UNIQUE(branch_id, product_id)
```

**9. transfers**
```sql
- id (uuid, primary key, default gen_random_uuid())
- from_branch_id (uuid, foreign key to branches)
- to_branch_id (uuid, foreign key to branches)
- status (enum: 'pending', 'approved', 'rejected', 'completed')
- requested_by (uuid, foreign key to users)
- approved_by (uuid, foreign key to users, nullable)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**10. transfer_items**
```sql
- id (uuid, primary key, default gen_random_uuid())
- transfer_id (uuid, foreign key to transfers)
- product_id (uuid, foreign key to products)
- unit (enum: 'carton', 'tray', 'kg')
- quantity (decimal(10,3), not null)
```

### 2.2 Database Functions & Triggers

**Triggers:**
1. **update_inventory_on_purchase** - Increase inventory when purchase is recorded
2. **update_inventory_on_sale** - Decrease inventory when sale is recorded
3. **update_balance_on_payment** - Update entity balance after payment
4. **update_inventory_on_transfer** - Move inventory between branches
5. **calculate_profit_on_sale** - Auto-calculate profit for each sale item
6. **update_timestamps** - Auto-update `updated_at` on record modification

**Functions:**
1. **get_entity_balance(entity_id, branch_id?)** - Get current balance for customer/supplier
2. **get_inventory_value(branch_id?)** - Calculate total inventory value
3. **get_dashboard_stats(user_id, branch_id?)** - Aggregate stats for dashboard
4. **allocate_payment_fifo(entity_id, payment_amount)** - FIFO payment allocation

### 2.3 Row Level Security (RLS) Policies

**Enable RLS on all tables and create policies:**

**Admin Role:**
- Full access to all rows

**Salesman Role:**
- Can only access data related to their assigned branch
- Can view admin branch inventory (read-only)
- Cannot access supplier data
- Cannot access cost prices in products
- Cannot access purchase transactions

**Example RLS Policy (for transactions):**
```sql
CREATE POLICY "Admins can access all transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND is_approved = true
    )
  );

CREATE POLICY "Salesmen can access their branch transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'salesman'
      AND is_approved = true
      AND (branch_id = transactions.branch_id OR transactions.branch_id IN (
        SELECT id FROM branches WHERE is_admin_branch = true
      ))
    )
  );
```

### 2.4 Supabase Setup Tasks

1. **Create all tables** with proper constraints
2. **Set up foreign key relationships** with ON DELETE CASCADE where appropriate
3. **Create indexes** for frequently queried columns:
   - `transactions.entity_id`
   - `transactions.branch_id`
   - `transaction_items.product_id`
   - `inventory.branch_id`
   - `inventory.product_id`
   - `payments.entity_id`
4. **Enable RLS** on all tables
5. **Create and apply RLS policies**
6. **Create database functions and triggers**
7. **Seed initial data:**
   - Admin branch
   - First admin user (manual setup via Supabase dashboard)

---

## Phase 3: Application Pages & Routing Structure

### 3.1 Project Structure

```
app/
├── (public)/
│   └── page.tsx                    # Public landing page
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── pending-approval/page.tsx   # For unapproved users
├── admin/
│   ├── layout.tsx                  # Admin-only layout with sidebar
│   ├── dashboard/page.tsx
│   ├── users/                      # User management & approval
│   │   ├── page.tsx                # List all users
│   │   └── [id]/page.tsx           # Approve/edit user
│   ├── products/
│   │   ├── page.tsx                # Product list with CRUD
│   │   └── [id]/page.tsx           # Edit product
│   ├── inventory/
│   │   ├── page.tsx                # View inventory (all branches)
│   │   └── value/page.tsx          # Inventory value report
│   ├── customers/
│   │   ├── page.tsx                # Customer list
│   │   ├── [id]/page.tsx           # Customer details
│   │   └── [id]/ledger/page.tsx    # Customer ledger (full-screen)
│   ├── suppliers/
│   │   ├── page.tsx                # Supplier list
│   │   ├── [id]/page.tsx           # Supplier details
│   │   └── [id]/ledger/page.tsx    # Supplier ledger
│   ├── purchases/
│   │   ├── page.tsx                # Purchase list
│   │   ├── new/page.tsx            # Create purchase
│   │   └── [id]/page.tsx           # View/edit purchase
│   ├── sales/
│   │   ├── page.tsx                # Sales list
│   │   ├── new/page.tsx            # Create sale
│   │   └── [id]/page.tsx           # View/edit sale
│   ├── transfers/
│   │   ├── page.tsx                # Transfer requests list
│   │   ├── new/page.tsx            # Create transfer
│   │   └── [id]/page.tsx           # View/approve transfer
│   ├── reports/
│   │   ├── page.tsx                # Reports dashboard
│   │   ├── profit-loss/page.tsx    # P&L statement
│   │   ├── sales-report/page.tsx   # Sales analysis
│   │   └── purchase-report/page.tsx # Purchase analysis
│   └── branches/
│       ├── page.tsx                # Branch management
│       └── [id]/page.tsx           # Edit branch
├── salesman/
│   ├── layout.tsx                  # Salesman-only layout
│   ├── dashboard/page.tsx
│   ├── inventory/page.tsx          # View own branch + admin branch
│   ├── sales/
│   │   ├── page.tsx                # Sales list
│   │   ├── new/page.tsx            # Create sale
│   │   └── [id]/page.tsx           # View sale
│   ├── customers/
│   │   ├── page.tsx                # Customer list
│   │   └── [id]/ledger/page.tsx    # Customer ledger
│   └── transfers/
│       ├── page.tsx                # Transfer requests
│       ├── new/page.tsx            # Request transfer
│       └── [id]/page.tsx           # View transfer status
└── api/
    └── webhooks/
        └── clerk/route.ts          # Clerk webhook handler
```

### 3.2 Shared Components

Create reusable UI components in `components/`:

**Layout Components:**
- `Sidebar.tsx` - Navigation sidebar
- `Header.tsx` - Top header with user menu
- `DashboardCard.tsx` - Stats card component

**Data Display:**
- `DataTable.tsx` - Reusable table with sorting, filtering, pagination
- `LedgerView.tsx` - Ledger display with running balance
- `InventoryCard.tsx` - Product inventory card
- `StatCard.tsx` - Dashboard statistic card

**Forms:**
- `ProductForm.tsx` - Add/edit product
- `SaleForm.tsx` - Create sale transaction
- `PurchaseForm.tsx` - Create purchase transaction
- `PaymentForm.tsx` - Record payment
- `TransferForm.tsx` - Create transfer request

**Utilities:**
- `CurrencyDisplay.tsx` - Format currency with AED symbol
- `DateRangePicker.tsx` - Filter by date range
- `RoleGuard.tsx` - Component-level role checking

### 3.3 API Layer (Supabase Client)

Create service files in `lib/services/`:

- `auth.service.ts` - User authentication and role checking
- `products.service.ts` - Product CRUD operations
- `inventory.service.ts` - Inventory management
- `transactions.service.ts` - Sales & purchases
- `entities.service.ts` - Customers & suppliers
- `payments.service.ts` - Payment processing & ledger
- `transfers.service.ts` - Branch transfers
- `reports.service.ts` - Analytics and reports
- `users.service.ts` - User management (admin only)

### 3.4 Middleware & Route Protection

Update `proxy.ts` to:
1. Check if user is authenticated (Clerk)
2. Verify user exists and is approved in Supabase
3. Check role-based access:
   - `/admin/*` → require `role = 'admin'`
   - `/salesman/*` → require `role = 'salesman'`
4. Redirect unapproved users to `/pending-approval`

### 3.5 Key Features Implementation

**Dashboard:**
- Show key metrics (sales today, purchases today, inventory value, receivables, payables)
- Recent transactions list
- Low stock alerts
- Pending transfers (for admin)

**Ledger System (FIFO):**
- Full-screen ledger page
- Chronological display of all transactions and payments
- Running balance calculation
- Payment allocation using FIFO method
- Visual distinction between transaction types (sale, purchase, payment, credit, debit)
- Date range filtering
- Export to PDF/CSV

**Inventory Management:**
- Real-time stock levels per branch
- Inventory valuation (quantity × cost price)
- Stock movement history
- Low stock warnings
- Multi-unit conversion display

**Sales & Purchase Flow:**
1. Select entity (customer/supplier)
2. Add multiple items with quantities and units
3. Auto-calculate totals
4. Record partial/full payment
5. Update inventory automatically via triggers
6. Generate printable invoice/receipt

**Transfer System:**
1. Salesman requests transfer from admin branch
2. Admin approves/rejects
3. On approval, inventory moves automatically
4. Status tracking (pending, approved, rejected, completed)

---

## Phase 4: Responsiveness & UX Enhancements

### 4.1 Responsive Design

**Mobile-First Approach:**
- Use Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`, `xl:`)
- Collapsible sidebar for mobile
- Touch-friendly buttons and inputs
- Swipe gestures for table rows (delete, view details)
- Bottom navigation bar for mobile (alternative to sidebar)

**Tablet Optimization:**
- Split-screen layouts for tablets
- Optimized form layouts
- Grid-based dashboards

### 4.2 Design System

**Color Theme:**
- Primary: Vibrant green (fresh produce theme)
- Secondary: Deep orange (fruits theme)
- Dark mode support
- Glassmorphism effects for cards
- Smooth gradients for backgrounds

**Typography:**
- Google Fonts: Inter or Outfit
- Clear hierarchy (H1, H2, H3, body, caption)
- Readable font sizes (minimum 16px for body text)

**Components:**
- Consistent spacing (4px grid system)
- Rounded corners (border-radius: 8px, 12px, 16px)
- Subtle shadows and hover effects
- Micro-animations (fade-ins, slide-ins, button press effects)
- Loading skeletons for better perceived performance

### 4.3 Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast compliance (WCAG AA)
- Screen reader friendly

### 4.4 Performance Optimization

- Image optimization (Next.js Image component)
- Code splitting (dynamic imports)
- Server-side rendering for public pages
- Client-side caching (React Query or SWR)
- Debounced search inputs
- Virtual scrolling for large tables
- Lazy loading for modals and forms

### 4.5 User Experience Enhancements

**Visual Feedback:**
- Toast notifications for success/error messages
- Loading states for all async operations
- Confirmation dialogs for destructive actions
- Inline form validation with error messages

**Data Visualization:**
- Charts for sales trends (Chart.js or Recharts)
- Profit breakdown by product
- Monthly comparison graphs
- Inventory pie charts

**Printing & Export:**
- Print-optimized layouts for invoices and reports
- Export to CSV for data analysis
- PDF generation for ledgers and reports

---

## Phase 5: Testing & Deployment (Future)

### 5.1 Testing
- Unit tests for utility functions
- Integration tests for API routes
- End-to-end tests for critical flows (sale, purchase, payment)

### 5.2 Deployment
- Deploy to Vercel (recommended for Next.js)
- Environment variable configuration
- Database backup strategy
- Monitoring and error tracking (Sentry)

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. Complete Clerk-Supabase integration
2. Create all database tables and relationships
3. Implement RLS policies
4. Set up webhooks for user sync
5. Create admin approval flow

### Sprint 2: Core Features (Week 3-4)
1. Shared components and design system
2. Product management (CRUD)
3. Inventory tracking
4. Customer/Supplier management

### Sprint 3: Transactions (Week 5-6)
1. Purchase flow
2. Sales flow
3. Payment processing
4. FIFO ledger system

### Sprint 4: Advanced Features (Week 7-8)
1. Transfer system
2. Reports and analytics
3. Dashboard with real-time stats
4. User management for admin

### Sprint 5: Polish (Week 9-10)
1. Responsive design refinements
2. Dark mode
3. Animations and micro-interactions
4. Performance optimization
5. Final testing and bug fixes

---

## Next Immediate Steps

1. **Create Supabase SQL migration file** with all tables, triggers, and functions
2. **Set up Clerk webhook endpoint** to sync users to Supabase
3. **Update middleware** to check user approval status and role
4. **Create base layout components** (Sidebar, Header, DashboardCard)
5. **Implement design system** (colors, typography, spacing in Tailwind config)
6. **Build admin user approval page** as first functional feature

---

## Questions & Decisions Needed

1. **Should we support multiple currencies or stick with AED?**
   - Current: AED only (via env variable)
   
2. **Do we need multi-language support?**
   - Assumption: English only for now

3. **What level of audit logging is required?**
   - Suggestion: Track created_by and updated_by for all transactions

4. **Should salesmen be able to create customers, or only admin?**
   - Recommendation: Allow salesmen to create customers, but admin can edit all

5. **Invoice numbering system?**
   - Suggestion: Auto-generate sequential invoice numbers per branch (e.g., BR1-0001, BR2-0001)

6. **Return/refund handling?**
   - Future consideration: Add return transactions with negative amounts
