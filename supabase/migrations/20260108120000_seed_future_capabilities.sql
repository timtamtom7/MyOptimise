-- Seed capabilities from future.md into the capabilities table

INSERT INTO public.capabilities (name, category) VALUES
-- Content & Approvals
('content.view_drafts', 'content'),
('content.create', 'content'),
('content.delete', 'content'),
('content.approve_internal', 'content'),
('content.approve_client', 'content'),

-- Communication
('chat.internal_access', 'chat'),
('chat.client_access', 'chat'),
('chat.ghost_mode', 'chat'),

-- Sales & Growth
('sales.access', 'sales'),
('sales.lead_gen', 'sales'),
('sales.contracts', 'sales'),

-- Admin & Financials
('analytics.view_financials', 'analytics'),
('admin.impersonate', 'admin'),
('admin.billing', 'admin')
ON CONFLICT (name) DO NOTHING;
