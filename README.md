# Misbah Fruits and Vegetables - Internal Management System

A comprehensive internal management system for tracking purchases, sales, inventory, customer/supplier ledgers, and financial reports across multiple branches.

---

## 🏗️ Architecture

### Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Authentication:** Clerk (keyless mode)
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **Currency:** AED (configurable)

---

## 📱 Application Walkthrough

### Authentication Flow

1. **Sign Up/Sign In** (`/sign-in`, `/sign-up`)
   - Clean, minimal authentication forms powered by Clerk
   - New users are automatically synced to Supabase with `is_approved = false`

2. **Pending Approval** (`/pending-approval`)
   - Users who haven't been approved by an admin see a friendly waiting screen
   - Explains that an administrator needs to approve their account

3. **Role-Based Redirect** (`/dashboard`)
   - Once approved, users are redirected based on their role:
     - **Admin** → `/admin/dashboard`
     - **Salesman** → `/salesman/dashboard`

---

## 👨‍💼 Admin Portal

All admin routes are protected by middleware - non-admin users attempting to access `/admin/*` routes are automatically redirected.

### Dashboard (`/admin/dashboard`)
**Purpose:** Real-time operational overview of the entire business.

**UI/UX:**
- **Stats Cards Grid** - 6 key metrics displayed in premium card layout:
  - Total Sales Today (AED)
  - Total Purchases Today (AED)
  - Inventory Value (AED)
  - Receivables
  - Payables
  - Pending Transfers
- Each card has a color-coded icon, smooth hover animations, and optional trend indicators
- Placeholder sections for future Sales Trend Chart and Top Products
- Clean slate/emerald color scheme with subtle shadows

---

### Organization (`/admin/organization`) ⭐ Admin Only
**Purpose:** Unified management of users and branches in one place.

**UI/UX:**
- **Tabbed Interface** - Toggle between "Users" and "Branches" tabs
- Tab buttons show count badges (e.g., "Users (5)")
- Active tab has white background with shadow; inactive tabs are muted

**Users Tab:**
- DataTable showing all registered users
- Avatar with initials and email
- **Inline Role Dropdown** - Change user role (Pending/Salesman/Admin)
- **Status Badge** - Shows "Approved" (green) or "Pending" (amber)
- **Branch Assignment Dropdown** - Assign user to a branch
- **Action Buttons:**
  - Approve (green) - Approves pending users
  - Revoke (rose) - Revokes access

**Branches Tab:**
- Grid layout of branch cards
- Each card shows branch name, location, and "Main Branch" badge if applicable
- **Add New Branch** button opens a modal with form fields:
  - Branch name (required)
  - Location (optional textarea)
  - Checkbox for "Set as Main/Admin Branch"

---

### Products (`/admin/products`)
**Purpose:** Manage the product catalog with pricing and unit conversions.

**UI/UX:**
- Searchable DataTable with all products
- **Add New Product** button opens ProductModal
- **Product Modal** - Comprehensive form with:
  - Product name and description
  - **Pricing Grid** (3 columns):
    - Carton pricing (cost + sell in AED)
    - Tray pricing (cost + sell in AED)
    - KG pricing (cost + sell in AED)
  - **Conversion Ratios:** KG per Tray, Trays per Carton, KG per Carton
- Backdrop blur on modal with smooth animations
- Form validation with error display

---

### Customers (`/admin/customers`)
**Purpose:** Manage customer database and track balances.

**UI/UX:**
- DataTable with customer list
- Columns: Name, Phone, Location, Balance, Notes
- **New Customer** button opens EntityModal
- **EntityModal** - Form with:
  - Name (required)
  - Phone
  - Location
  - Notes
- Click on customer opens Ledger view (full transaction history with running balance)

---

### Suppliers (`/admin/suppliers`)
**Purpose:** Manage supplier/vendor contacts and track payables.

**UI/UX:**
- Same structure as Customers page
- DataTable with supplier list
- **New Supplier** button opens EntityModal
- **Payment Action** - 💵 Icon opens Ledger to record payments
- **FIFO Payment Flow** - Automatic allocation of payments to oldest invoices first
- Suppliers are used in Purchase transactions

---

### Sales (`/admin/sales`)
**Purpose:** View sales history and create new sales to customers.

**UI/UX:**
- **Header:** "Sales History" title with "New Sale" button
- DataTable with sortable, searchable transactions
- Columns: Date, Customer, Amount, Paid, Balance, Status
- Clicking a row shows transaction details with line items

**Create Sale (`/admin/sales/create`):**
- Select customer from dropdown
- Add products with quantity and unit selection
- Auto-calculated totals
- Record payment amount
- Notes field

---

### Purchases (`/admin/purchases`)
**Purpose:** Log incoming stock from suppliers.

**UI/UX:**
- Same structure as Sales page
- **Header:** "Purchase History" with "New Purchase" button
- DataTable with purchase transactions
- Columns: Date, Supplier, Amount, Paid, Balance, Status

**Create Purchase (`/admin/purchases/create`):**
- Select supplier from dropdown
- Add products with cost price, quantity, and unit
- Auto-calculated totals
- Record payment amount
- Inventory automatically updated via database trigger

---

### Stock Transfers (`/admin/transfers`)
**Purpose:** Manage inter-branch stock movement requests.

**UI/UX:**
- DataTable with all transfer requests
- Columns: Date, From→To (branches), Items count, Requester, Status, Actions
- **Items Button** - Opens Transfer Details Modal showing all line items
- **Status Badges:**
  - Pending (amber)
  - Completed (emerald)
  - Rejected (rose)
- **Action Buttons** (visible for pending only):
  - ✓ Approve - Triggers stock movement
  - ✗ Reject - Rejects request

**Transfer Details Modal:**
- Shows From/To branches
- Notes section if present
- List of requested items with product name and quantity
- Approve/Reject buttons in footer

---

## 👷 Salesman Portal

Salesmen have restricted access - they can only see their assigned branch data and read-only access to admin branch inventory.

### Dashboard (`/salesman/dashboard`)
**Purpose:** Personalized overview for the salesman.

**UI/UX:**
- Same card-based stats layout as admin
- Only shows data relevant to their assigned branch
- Pending transfers count for their branch

---

### Inventory (`/salesman/inventory`)
**Purpose:** View stock levels and request transfers.

**UI/UX:**
- Shows inventory grouped by branch
- **Own Branch** - Full visibility of current stock levels
- **Admin Branch** - Read-only view of available stock
- Each product card shows:
  - Product name
  - Stock in KG
  - Last updated time
- **Request Transfer** - Can request stock from admin branch

---

### Transfer Requests (`/salesman/transfers`)
**Purpose:** Track status of submitted stock requests.

**UI/UX:**
- DataTable showing all transfer requests (Incoming & Outgoing unified)
- Columns: Date, Status, Items
- **Details Modal** - Click row to view full transfer details
- Status tracking (Pending → Completed/Rejected)
- Cannot create requests directly here - done from Inventory page

---

### Customers (`/salesman/customers`)
**Purpose:** Manage customers in their assigned branch.

**UI/UX:**
- Same as admin customers but filtered to branch
- Can create new customers
- Can view customer ledger

---

### Sales (`/salesman/sales`)
**Purpose:** Record sales transactions.

**UI/UX:**
- Same structure as admin sales
- Transactions are branch-scoped
- Can create new sales

---

## 🎨 Design System

### Color Palette
- **Primary:** Emerald (#10B981) - Actions, success states
- **Secondary:** Slate (#475569) - Text, borders
- **Accent Colors:**
  - Amber - Warnings, pending states
  - Rose - Errors, destructive actions
  - Blue - Information, inventory
  - Indigo - Payables

### Typography
- **Font:** System fonts with Inter fallback
- **Headings:** Bold tracking-tight (2xl for page titles)
- **Body:** Medium weight, slate-500/600

### Components
- **Cards:** Rounded-3xl with subtle shadows and hover lift
- **Buttons:** Rounded-xl with active scale-95 animation
- **Modals:** Backdrop blur with smooth fade-in/zoom-in
- **Tables:** Clean DataTable with search, pagination, and refresh
- **Scrollbars:** Custom thin, modern scrollbars matching theme
- **Inputs:** High-contrast text for better readability
- **Badges:** Rounded-full with color-coded backgrounds

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Collapsible sidebar on mobile (hamburger menu)
- Touch-friendly button sizes (min 44px)
- Stacked layouts on small screens

---

## 🔐 Authentication & Authorization

### Clerk Integration
Users sign up through Clerk, which provides secure authentication. User data is synced to Supabase via webhooks.

### User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to all data, all branches, purchases, suppliers, approvals |
| **Salesman** | Own branch + read-only admin branch, sales, transfers |
| **Pending** | No access - redirected to pending approval page |

### Middleware Protection
- `/admin/*` routes → Requires `role === 'admin'`
- `/salesman/*` routes → Requires `role === 'salesman'` or `'admin'`
- Unapproved users → Redirected to `/pending-approval`

---

## 🗄️ Database Schema

### Core Tables

- **users** - Clerk-synced with roles and branch assignments
- **branches** - Physical locations (one admin + multiple sales)
- **products** - Items with cost/selling prices per unit
- **entities** - Combined customers and suppliers
- **transactions** - Sales and purchases with line items
- **transaction_items** - Individual products in a transaction
- **payments** - Ledger entries with FIFO allocation
- **inventory** - Real-time stock (branch + product)
- **transfers** - Transfer request headers
- **transfer_items** - Products in a transfer request

### Row Level Security (RLS)
All tables have RLS policies enforcing data access:
- Admin: Full access
- Salesman: Own branch + admin branch (read-only)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Clerk account (free tier)
- Supabase project

### Environment Setup

```bash
# Clone and install
git clone <repository-url>
cd client
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run migrations in Supabase SQL editor
# Files: supabase/migrations/001_initial_schema.sql, 002, 003, 004...

# Start development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (for server actions)
NEXT_PUBLIC_CURRENCY=AED
```

---

## 📁 Project Structure

```
app/
├── (auth)/                # Sign in/up, pending approval
├── admin/                 # Admin-only routes
│   ├── dashboard/
│   ├── organization/      # Users + Branches (tabbed)
│   ├── products/
│   ├── customers/
│   ├── suppliers/
│   ├── sales/
│   ├── purchases/
│   └── transfers/
├── salesman/              # Salesman-only routes
│   ├── dashboard/
│   ├── inventory/
│   ├── customers/
│   ├── sales/
│   └── transfers/
├── actions/               # Server actions
│   ├── transfer-actions.ts
│   └── branch-actions.ts
├── actions.ts             # Main server actions
└── api/webhooks/clerk/    # Clerk user sync

components/
├── layout/                # Sidebar, Header
├── ui/                    # DataTable, Spinner, etc.
└── entities/              # EntityModal, Tables

lib/
├── store/                 # Zustand stores
├── services/              # Supabase clients
└── config.ts              # App configuration
```

---

## 🛠️ Development

### Build for Production
```bash
npm run build
npm start
```

### Run Linting
```bash
npm run lint
```

---

## 📋 Feature Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed specifications.

### Completed ✅
- [x] Clerk authentication
- [x] User approval flow
- [x] Product management (CRUD)
- [x] Customer/Supplier management
- [x] Sales & Purchase transactions
- [x] Multi-branch inventory
- [x] Stock transfer system (multi-item)
- [x] Unified Organization page
- [x] Ledger with FIFO payments
- [x] Salesman Transfer UI Refactor

### In Progress 🔄
- [ ] Reports & analytics
- [ ] PDF invoice generation

### Planned 📋
- [ ] Dark mode
- [ ] Offline support
- [ ] Mobile app

---

**Built with ❤️ for Misbah Fruits and Vegetables**
