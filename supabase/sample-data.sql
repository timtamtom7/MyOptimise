-- Sample Data for Testing
-- This creates a complete test organization with users, tasks, and data

-- Create test organization
INSERT INTO organizations (id, name, slug, description, industry, size, plan) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Optimise Operations', 'optimise-ops', 'Full-service marketing and operations agency', 'Marketing', 'medium', 'professional');

-- Create test users
INSERT INTO users (id, email, name, avatar_url, timezone, locale) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'admin@optimiseoperations.com', 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'Australia/Sydney', 'en'),
  ('660e8400-e29b-41d4-a716-446655440002', 'manager@optimiseoperations.com', 'Sarah Manager', 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face', 'Australia/Sydney', 'en'),
  ('660e8400-e29b-41d4-a716-446655440003', 'employee@optimiseoperations.com', 'John Employee', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'Australia/Sydney', 'en'),
  ('660e8400-e29b-41d4-a716-446655440004', 'client@example.com', 'Client User', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'Australia/Sydney', 'en');

-- Create organization memberships
INSERT INTO organization_members (organization_id, user_id, role, status, invited_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'owner', 'active', '660e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'manager', 'active', '660e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440003', 'employee', 'active', '660e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440004', 'client', 'active', '660e8400-e29b-41d4-a716-446655440001');

-- Create sample tasks
INSERT INTO tasks (id, organization_id, owner_id, primary_assignee_id, title, description, status, priority, visibility, due_date, estimated_hours, tags) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Design new marketing campaign', 'Create visual assets and copy for Q1 campaign', 'in_progress', 'high', 'team', NOW() + INTERVAL '7 days', 16, '{"design", "marketing"}'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Update website content', 'Refresh homepage and about page content', 'completed', 'medium', 'team', NOW() - INTERVAL '3 days', 8, '{"website", "content"}'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Prepare client presentation', 'Create slides for monthly client review', 'not_started', 'medium', 'client', NOW() + INTERVAL '5 days', 4, '{"presentation", "client"}'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Social media content calendar', 'Plan and schedule social media posts for next month', 'in_progress', 'medium', 'team', NOW() + INTERVAL '14 days', 12, '{"social", "content"}'),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'SEO optimization review', 'Analyze and optimize website SEO performance', 'completed', 'high', 'team', NOW() - INTERVAL '10 days', 20, '{"seo", "optimization"}');

-- Create task assignments
INSERT INTO task_assignments (task_id, user_id, role, assigned_by) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'primary', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'contributor', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'primary', '660e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'primary', '660e8400-e29b-41d4-a716-446655440003'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'primary', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'reviewer', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'primary', '660e8400-e29b-41d4-a716-446655440001');

-- Create task comments
INSERT INTO task_comments (task_id, author_id, content, is_internal) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Great progress on the campaign design! The initial concepts look promising.', FALSE),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'Thanks! I\'ll have the final mockups ready by end of week.', FALSE),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Website content has been updated successfully. All pages are now live.', FALSE),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Started working on the presentation. Will need client feedback on key metrics.', TRUE);

-- Create calendar events
INSERT INTO calendar_events (id, organization_id, creator_id, title, description, event_type, start_time, end_time, location, color, attendees) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Weekly Team Meeting', 'Review progress and plan upcoming week', 'meeting', NOW() + INTERVAL '2 days 10:00', NOW() + INTERVAL '2 days 11:00', 'Conference Room A', '#4F7DFF', '{"660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440003"}'),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Client Review Call', 'Monthly progress review with client', 'meeting', NOW() + INTERVAL '7 days 14:00', NOW() + INTERVAL '7 days 15:00', 'Zoom', '#10B981', '{"660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440004"}'),
  ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Campaign Launch', 'Launch new marketing campaign', 'campaign', NOW() + INTERVAL '14 days 09:00', NOW() + INTERVAL '14 days 17:00', 'All channels', '#F59E0B', '{"660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440003"}'),
  ('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440003', 'Task Deadline', 'Complete social media content calendar', 'deadline', NOW() + INTERVAL '14 days 17:00', NOW() + INTERVAL '14 days 17:00', NULL, '#EF4444', '{"660e8400-e29b-41d4-a716-446655440003"}');

-- Create event attendees
INSERT INTO event_attendees (event_id, user_id, status) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'accepted'),
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'accepted'),
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'accepted'),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'accepted'),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'accepted'),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'pending');

-- Create message threads
INSERT INTO message_threads (id, organization_id, title, type, visibility, participants) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'General Team Chat', 'announcement', 'team', '{"660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440003"}'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Campaign Design Discussion', 'task', 'team', '{"660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440003"}'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Client Support', 'support', 'internal', '{"660e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440004"}');

-- Create messages
INSERT INTO messages (thread_id, sender_id, content, content_type) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Welcome to the team! Looking forward to working with everyone.', 'text'),
  ('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Thanks! Excited to be part of the team.', 'text'),
  ('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'How is the campaign design coming along?', 'text'),
  ('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Making good progress. Should have initial concepts ready by tomorrow.', 'text'),
  ('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'I need help with my account settings. Can someone assist?', 'text'),
  ('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'I\'ll help you with that right away!', 'text');

-- Create client services
INSERT INTO client_services (id, organization_id, name, service_type, handle, is_active, settings) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Instagram Business', 'instagram', '@optimiseoperations', TRUE, '{"business_category": "Marketing", "follower_count": 5920, "engagement_rate": 3.2}'),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Facebook Page', 'facebook', 'optimiseoperations', TRUE, '{"page_category": "Marketing Agency", "likes": 3400, "followers": 3800}'),
  ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Pinterest Business', 'pinterest', 'optimise-ops', TRUE, '{"monthly_views": 125000, "boards": 12, "pins": 450}'),
  ('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Email Marketing', 'email', 'newsletter@optimiseoperations.com', TRUE, '{"subscriber_count": 2500, "open_rate": 28.5, "click_rate": 4.2}'),
  ('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Website Analytics', 'website', 'optimiseoperations.com', TRUE, '{"monthly_visitors": 8500, "bounce_rate": 42.3, "avg_session_duration": 180}');

-- Create service metrics
INSERT INTO service_metrics (service_id, metric_name, metric_value, metric_unit, recorded_at) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 'followers', 5920, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440001', 'engagement_rate', 3.2, 'percent', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440001', 'posts_this_week', 12, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'page_likes', 3400, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'page_followers', 3800, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'post_reach', 12500, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440003', 'monthly_views', 125000, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440003', 'saves', 850, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440004', 'subscribers', 2500, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440004', 'open_rate', 28.5, 'percent', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440004', 'click_rate', 4.2, 'percent', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440005', 'monthly_visitors', 8500, 'count', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440005', 'bounce_rate', 42.3, 'percent', NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440005', 'avg_session_duration', 180, 'seconds', NOW());

-- Create analytics data
INSERT INTO analytics_data (organization_id, metric_type, metric_name, value, unit, source, period_start, dimensions) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'engagement', 'instagram_likes', 1250, 'count', 'api', NOW() - INTERVAL '7 days', '{"platform": "instagram"}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'engagement', 'instagram_comments', 320, 'count', 'api', NOW() - INTERVAL '7 days', '{"platform": "instagram"}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'reach', 'facebook_reach', 12500, 'count', 'api', NOW() - INTERVAL '7 days', '{"platform": "facebook"}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'conversion', 'email_clicks', 105, 'count', 'api', NOW() - INTERVAL '7 days', '{"platform": "email"}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'traffic', 'website_sessions', 2100, 'count', 'api', NOW() - INTERVAL '7 days', '{"platform": "website"}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'engagement', 'pinterest_saves', 450, 'count', 'api', NOW() - INTERVAL '7 days', '{"platform": "pinterest"}');

-- Create support tickets
INSERT INTO support_tickets (id, organization_id, client_id, assigned_to, title, description, priority, status, category, due_date) VALUES
  ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Account access issues', 'Cannot access analytics dashboard', 'high', 'in_progress', 'Technical', NOW() + INTERVAL '1 day'),
  ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'Billing inquiry', 'Question about monthly invoice', 'medium', 'resolved', 'Billing', NOW() - INTERVAL '2 days'),
  ('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440004', NULL, 'Feature request', 'Request for additional reporting features', 'low', 'open', 'Feature', NOW() + INTERVAL '14 days');

-- Create notifications
INSERT INTO notifications (user_id, organization_id, title, content, type, action_url, action_text, expires_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'New task assigned', 'You have been assigned to "Design new marketing campaign"', 'task', '/tasks/770e8400-e29b-41d4-a716-446655440001', 'View Task', NOW() + INTERVAL '7 days'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Campaign review scheduled', 'Client review call scheduled for next week', 'info', '/calendar', 'View Calendar', NOW() + INTERVAL '7 days'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Task deadline approaching', 'Social media content calendar due in 2 weeks', 'warning', '/tasks/770e8400-e29b-41d4-a716-446655440004', 'View Task', NOW() + INTERVAL '14 days'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Support ticket updated', 'Your support ticket has been updated', 'info', '/support/bb0e8400-e29b-41d4-a716-446655440001', 'View Ticket', NOW() + INTERVAL '3 days');

-- Create user preferences
INSERT INTO user_preferences (user_id, organization_id, dashboard_layout, notification_settings, theme, timezone, locale) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '{"widgets": ["tasks", "calendar", "analytics"], "layout": "grid"}', '{"email": true, "push": true, "sms": false}', 'light', 'Australia/Sydney', 'en'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '{"widgets": ["tasks", "calendar", "messages"], "layout": "list"}', '{"email": true, "push": true, "sms": true}', 'light', 'Australia/Sydney', 'en'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '{"widgets": ["tasks", "calendar"], "layout": "grid"}', '{"email": true, "push": false, "sms": false}', 'dark', 'Australia/Sydney', 'en'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '{"widgets": ["analytics", "services"], "layout": "grid"}', '{"email": true, "push": true, "sms": false}', 'system', 'Australia/Sydney', 'en');

-- Create audit logs
INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, old_values, new_values, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'organization.created', 'organization', '550e8400-e29b-41d4-a716-446655440000', '{}', '{"name": "Optimise Operations", "slug": "optimise-ops"}', '{"ip": "192.168.1.1", "user_agent": "Mozilla/5.0"}'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'user.invited', 'organization_member', '660e8400-e29b-41d4-a716-446655440002', '{}', '{"role": "manager", "status": "active"}', '{"invited_by": "admin@optimiseoperations.com"}'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'task.created', 'task', '770e8400-e29b-41d4-a716-446655440001', '{}', '{"title": "Design new marketing campaign", "status": "in_progress"}', '{"assigned_to": "employee@optimiseoperations.com"}'),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440004', 'support_ticket.created', 'support_ticket', 'bb0e8400-e29b-41d4-a716-446655440001', '{}', '{"title": "Account access issues", "priority": "high"}', '{"category": "Technical"}');