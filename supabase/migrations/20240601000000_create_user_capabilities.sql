-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the user_capabilities table
-- This table implements the Attribute-Based Access Control (ABAC) system
-- linking 1:1 with the auth.users table (or your public.users profile table)

CREATE TABLE IF NOT EXISTS public.user_capabilities (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- CONTENT & APPROVALS
    content_view_drafts BOOLEAN DEFAULT FALSE,
    content_create BOOLEAN DEFAULT FALSE,
    content_delete BOOLEAN DEFAULT FALSE,
    content_approve_internal BOOLEAN DEFAULT FALSE,
    content_approve_client BOOLEAN DEFAULT FALSE,
    
    -- COMMUNICATION
    chat_internal_access BOOLEAN DEFAULT TRUE,
    chat_client_access BOOLEAN DEFAULT FALSE, -- Restricted by default
    chat_ghost_mode BOOLEAN DEFAULT FALSE,    -- Admin only
    
    -- SALES & GROWTH
    sales_access BOOLEAN DEFAULT FALSE,
    sales_lead_gen BOOLEAN DEFAULT FALSE,
    sales_contracts BOOLEAN DEFAULT FALSE,
    
    -- ADMIN & FINANCIALS
    analytics_view_financials BOOLEAN DEFAULT FALSE,
    admin_impersonate BOOLEAN DEFAULT FALSE,
    admin_billing BOOLEAN DEFAULT FALSE,
    
    -- METADATA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- 1. Admins (God Mode) can do everything
-- Note: You'll need a way to bootstrap the first admin. 
-- Usually, we check if the querying user has 'admin_impersonate' true, 
-- but for the policy itself to read the table, we face a recursion issue.
-- Solution: We trust the service_role for admin updates, or use a separate 'roles' table for the bootstrap.
-- For now, let's allow users to read their OWN capabilities.

CREATE POLICY "Users can read own capabilities" 
ON public.user_capabilities 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Only Admins can UPDATE capabilities (This needs a secure function or service_role execution)
-- We will use a Postgres Function 'admin_update_capability' to handle this securely, 
-- rather than exposing direct UPDATE access to the table.

-- FUNCTION: Automatically create capabilities row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_capabilities() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_capabilities (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Run after auth.users insert
-- DROP TRIGGER IF EXISTS on_auth_user_created_capabilities ON auth.users;
-- CREATE TRIGGER on_auth_user_created_capabilities
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_capabilities();
