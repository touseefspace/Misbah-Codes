-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  is_admin_branch boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT branches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.entities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type USER-DEFINED NOT NULL,
  phone text,
  location text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity_carton numeric NOT NULL DEFAULT 0,
  quantity_tray numeric NOT NULL DEFAULT 0,
  quantity_kg numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  transaction_id uuid,
  branch_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_type USER-DEFINED NOT NULL,
  balance_before numeric,
  balance_after numeric,
  notes text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id),
  CONSTRAINT payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  cost_price_carton numeric,
  cost_price_tray numeric,
  cost_price_kg numeric,
  selling_price_carton numeric,
  selling_price_tray numeric,
  selling_price_kg numeric,
  kg_per_tray numeric,
  tray_per_carton integer,
  kg_per_carton numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transaction_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  product_id uuid NOT NULL,
  unit USER-DEFINED NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  cost_price numeric,
  selling_price numeric,
  amount numeric NOT NULL,
  profit numeric,
  CONSTRAINT transaction_items_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type USER-DEFINED NOT NULL,
  entity_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  balance numeric DEFAULT (total_amount - paid_amount),
  notes text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id),
  CONSTRAINT transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.transfer_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  unit USER-DEFINED NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  CONSTRAINT transfer_items_pkey PRIMARY KEY (id),
  CONSTRAINT transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id),
  CONSTRAINT transfer_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_branch_id uuid NOT NULL,
  to_branch_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::transfer_status,
  requested_by text,
  approved_by text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transfers_pkey PRIMARY KEY (id),
  CONSTRAINT transfers_from_branch_id_fkey FOREIGN KEY (from_branch_id) REFERENCES public.branches(id),
  CONSTRAINT transfers_to_branch_id_fkey FOREIGN KEY (to_branch_id) REFERENCES public.branches(id),
  CONSTRAINT transfers_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT transfers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role USER-DEFINED NOT NULL DEFAULT 'pending'::user_role,
  is_approved boolean NOT NULL DEFAULT false,
  branch_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);