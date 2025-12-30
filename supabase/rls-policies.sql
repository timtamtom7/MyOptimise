-- Row Level Security (RLS) Policies
-- Production-grade security for multi-tenant SaaS

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = org_id 
    AND u.email = user_email
    AND om.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user capabilities
CREATE OR REPLACE FUNCTION has_capability(cap_name TEXT, org_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check user-specific capabilities
  IF EXISTS (
    SELECT 1 
    FROM user_capabilities uc
    JOIN capabilities c ON c.id = uc.capability_id
    JOIN users u ON u.id = uc.user_id
    JOIN organization_members om ON om.user_id = u.id AND om.organization_id = org_id
    WHERE c.name = cap_name 
    AND u.email = user_email
    AND uc.organization_id = org_id
    AND uc.granted = TRUE
    AND om.status = 'active'
    AND (uc.expires_at IS NULL OR uc.expires_at > NOW())
  ) THEN
    RETURN TRUE;
  END IF;

  -- Then check role-based capabilities
  RETURN EXISTS (
    SELECT 1 
    FROM role_capabilities rc
    JOIN capabilities c ON c.id = rc.capability_id
    JOIN organization_members om ON om.role = rc.role
    JOIN users u ON u.id = om.user_id
    WHERE c.name = cap_name 
    AND u.email = user_email
    AND om.organization_id = org_id
    AND rc.granted = TRUE
    AND om.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Organizations visible to members" ON organizations
  FOR SELECT USING (
    is_organization_member(id, auth.email()) OR
    EXISTS (
      SELECT 1 FROM users WHERE email = auth.email() AND id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Organizations updatable by admins" ON organizations
  FOR UPDATE USING (
    has_capability('organization.update', id, auth.email())
  );

CREATE POLICY "Organizations deletable by owners" ON organizations
  FOR DELETE USING (
    has_capability('organization.delete', id, auth.email())
  );

-- Users policies (users can see their own data)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    email = auth.email() OR
    id = current_setting('app.current_user_id')::UUID
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    email = auth.email() OR
    id = current_setting('app.current_user_id')::UUID
  );

-- Organization Members policies
CREATE POLICY "Members visible to organization" ON organization_members
  FOR SELECT USING (
    is_organization_member(organization_id, auth.email())
  );

CREATE POLICY "Members manageable by admins" ON organization_members
  FOR ALL USING (
    has_capability('organization.members.manage', organization_id, auth.email())
  );

-- Tasks policies
CREATE POLICY "Tasks visible based on visibility and membership" ON tasks
  FOR SELECT USING (
    -- Private tasks: only owner and assignees
    (visibility = 'private' AND (
      owner_id = current_setting('app.current_user_id')::UUID OR
      primary_assignee_id = current_setting('app.current_user_id')::UUID OR
      EXISTS (
        SELECT 1 FROM task_assignments ta 
        WHERE ta.task_id = tasks.id AND ta.user_id = current_setting('app.current_user_id')::UUID
      )
    )) OR
    -- Team tasks: organization members
    (visibility = 'team' AND is_organization_member(organization_id, auth.email())) OR
    -- Client tasks: clients can see their related tasks
    (visibility = 'client' AND (
      is_organization_member(organization_id, auth.email()) AND
      EXISTS (
        SELECT 1 FROM organization_members om
        JOIN users u ON u.id = om.user_id
        WHERE om.organization_id = tasks.organization_id
        AND u.email = auth.email()
        AND om.role = 'client'
      )
    )) OR
    -- Public tasks: anyone in organization
    (visibility = 'public' AND is_organization_member(organization_id, auth.email()))
  );

CREATE POLICY "Tasks creatable by authorized users" ON tasks
  FOR INSERT WITH CHECK (
    has_capability('task.create', organization_id, auth.email()) AND
    is_organization_member(organization_id, auth.email())
  );

CREATE POLICY "Tasks updatable by owners or authorized users" ON tasks
  FOR UPDATE USING (
    (owner_id = current_setting('app.current_user_id')::UUID AND 
     has_capability('task.update.own', organization_id, auth.email())) OR
    has_capability('task.update.all', organization_id, auth.email())
  );

CREATE POLICY "Tasks deletable by owners or admins" ON tasks
  FOR DELETE USING (
    (owner_id = current_setting('app.current_user_id')::UUID AND 
     has_capability('task.delete.own', organization_id, auth.email())) OR
    has_capability('task.delete.all', organization_id, auth.email())
  );

-- Task Assignments policies
CREATE POLICY "Task assignments visible to task viewers" ON task_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_assignments.task_id
      AND (
        (tasks.visibility = 'private' AND 
         (tasks.owner_id = current_setting('app.current_user_id')::UUID OR 
          tasks.primary_assignee_id = current_setting('app.current_user_id')::UUID OR
          EXISTS (
            SELECT 1 FROM task_assignments ta 
            WHERE ta.task_id = tasks.id AND ta.user_id = current_setting('app.current_user_id')::UUID
          ))) OR
        (tasks.visibility IN ('team', 'public') AND 
         is_organization_member(tasks.organization_id, auth.email())) OR
        (tasks.visibility = 'client' AND 
         is_organization_member(tasks.organization_id, auth.email()) AND
         EXISTS (
           SELECT 1 FROM organization_members om
           JOIN users u ON u.id = om.user_id
           WHERE om.organization_id = tasks.organization_id
           AND u.email = auth.email()
           AND om.role = 'client'
         ))
      )
    )
  );

CREATE POLICY "Task assignments manageable by task managers" ON task_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_assignments.task_id
      AND (
        has_capability('task.assign', tasks.organization_id, auth.email()) OR
        (tasks.owner_id = current_setting('app.current_user_id')::UUID AND 
         has_capability('task.assign.own', tasks.organization_id, auth.email()))
      )
    )
  );

-- Task Comments policies
CREATE POLICY "Task comments visible based on task visibility" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id
      AND (
        (tasks.visibility = 'private' AND 
         (tasks.owner_id = current_setting('app.current_user_id')::UUID OR 
          tasks.primary_assignee_id = current_setting('app.current_user_id')::UUID OR
          EXISTS (
            SELECT 1 FROM task_assignments ta 
            WHERE ta.task_id = tasks.id AND ta.user_id = current_setting('app.current_user_id')::UUID
          ))) OR
        (tasks.visibility IN ('team', 'public') AND 
         is_organization_member(tasks.organization_id, auth.email())) OR
        (tasks.visibility = 'client' AND 
         is_organization_member(tasks.organization_id, auth.email()) AND
         task_comments.is_internal = FALSE)
      )
    )
  );

CREATE POLICY "Task comments creatable by task participants" ON task_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id
      AND (
        tasks.owner_id = current_setting('app.current_user_id')::UUID OR 
        tasks.primary_assignee_id = current_setting('app.current_user_id')::UUID OR
        EXISTS (
          SELECT 1 FROM task_assignments ta 
          WHERE ta.task_id = tasks.id AND ta.user_id = current_setting('app.current_user_id')::UUID
        )
      )
    )
  );

-- Calendar Events policies
CREATE POLICY "Calendar events visible to organization members" ON calendar_events
  FOR SELECT USING (
    is_organization_member(organization_id, auth.email()) OR
    (is_public = TRUE AND is_organization_member(organization_id, auth.email()))
  );

CREATE POLICY "Calendar events manageable by authorized users" ON calendar_events
  FOR ALL USING (
    has_capability('calendar.manage', organization_id, auth.email()) AND
    is_organization_member(organization_id, auth.email())
  );

-- Event Attendees policies
CREATE POLICY "Event attendees visible to event viewers" ON event_attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_events 
      WHERE calendar_events.id = event_attendees.event_id
      AND is_organization_member(calendar_events.organization_id, auth.email())
    )
  );

-- Message Threads policies
CREATE POLICY "Message threads visible based on type and membership" ON message_threads
  FOR SELECT USING (
    -- Direct messages: participants only
    (type = 'dm' AND current_setting('app.current_user_id')::UUID = ANY(participants)) OR
    -- Task messages: task visibility rules apply
    (type = 'task' AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = message_threads.linked_entity_id::UUID
      AND (
        (t.visibility = 'private' AND 
         (t.owner_id = current_setting('app.current_user_id')::UUID OR 
          t.primary_assignee_id = current_setting('app.current_user_id')::UUID)) OR
        (t.visibility IN ('team', 'public') AND 
         is_organization_member(t.organization_id, auth.email())) OR
        (t.visibility = 'client' AND 
         is_organization_member(t.organization_id, auth.email()) AND
         message_threads.visibility != 'internal')
      )
    )) OR
    -- Support messages: client or assigned staff
    (type = 'support' AND (
      EXISTS (
        SELECT 1 FROM support_tickets st
        WHERE st.id = message_threads.linked_entity_id::UUID
        AND (st.client_id = current_setting('app.current_user_id')::UUID OR 
             st.assigned_to = current_setting('app.current_user_id')::UUID)
      ) OR
      is_organization_member(organization_id, auth.email())
    )) OR
    -- Client messages: clients can see non-internal
    (type = 'client' AND is_organization_member(organization_id, auth.email()) AND 
     (visibility != 'internal' OR has_capability('message.view.internal', organization_id, auth.email()))) OR
    -- Announcements: all organization members
    (type = 'announcement' AND is_organization_member(organization_id, auth.email()))
  );

CREATE POLICY "Message threads creatable by organization members" ON message_threads
  FOR INSERT WITH CHECK (
    is_organization_member(organization_id, auth.email()) AND
    current_setting('app.current_user_id')::UUID = ANY(participants)
  );

-- Messages policies
CREATE POLICY "Messages visible based on thread visibility" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = messages.thread_id
      AND (
        -- Follow same visibility rules as threads
        (mt.type = 'dm' AND current_setting('app.current_user_id')::UUID = ANY(mt.participants)) OR
        (mt.type = 'task' AND EXISTS (
          SELECT 1 FROM tasks t
          WHERE t.id = mt.linked_entity_id::UUID
          AND (
            (t.visibility = 'private' AND 
             (t.owner_id = current_setting('app.current_user_id')::UUID OR 
              t.primary_assignee_id = current_setting('app.current_user_id')::UUID)) OR
            (t.visibility IN ('team', 'public') AND 
             is_organization_member(t.organization_id, auth.email())) OR
            (t.visibility = 'client' AND 
             is_organization_member(t.organization_id, auth.email()) AND
             messages.is_internal = FALSE)
          )
        )) OR
        (mt.type = 'support' AND (
          EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = mt.linked_entity_id::UUID
            AND (st.client_id = current_setting('app.current_user_id')::UUID OR 
                 st.assigned_to = current_setting('app.current_user_id')::UUID)
          ) OR
          is_organization_member(mt.organization_id, auth.email())
        )) OR
        (mt.type = 'client' AND is_organization_member(mt.organization_id, auth.email()) AND 
         (messages.is_internal = FALSE OR has_capability('message.view.internal', mt.organization_id, auth.email()))) OR
        (mt.type = 'announcement' AND is_organization_member(mt.organization_id, auth.email()))
      )
    )
  );

CREATE POLICY "Messages creatable by thread participants" ON messages
  FOR INSERT WITH CHECK (
    sender_id = current_setting('app.current_user_id')::UUID AND
    EXISTS (
      SELECT 1 FROM message_threads 
      WHERE id = messages.thread_id 
      AND current_setting('app.current_user_id')::UUID = ANY(participants)
    )
  );

-- Analytics Data policies
CREATE POLICY "Analytics data visible to organization members" ON analytics_data
  FOR SELECT USING (
    is_organization_member(organization_id, auth.email())
  );

CREATE POLICY "Analytics data manageable by authorized users" ON analytics_data
  FOR ALL USING (
    has_capability('analytics.manage', organization_id, auth.email()) AND
    is_organization_member(organization_id, auth.email())
  );

-- Client Services policies
CREATE POLICY "Client services visible to organization members" ON client_services
  FOR SELECT USING (
    is_organization_member(organization_id, auth.email())
  );

CREATE POLICY "Client services manageable by authorized users" ON client_services
  FOR ALL USING (
    has_capability('client.services.manage', organization_id, auth.email()) AND
    is_organization_member(organization_id, auth.email())
  );

-- Support Tickets policies
CREATE POLICY "Support tickets visible based on role" ON support_tickets
  FOR SELECT USING (
    -- Clients can see their own tickets
    (client_id = current_setting('app.current_user_id')::UUID) OR
    -- Assigned staff can see their tickets
    (assigned_to = current_setting('app.current_user_id')::UUID) OR
    -- Organization admins can see all tickets
    (is_organization_member(organization_id, auth.email()) AND 
     has_capability('support.view.all', organization_id, auth.email()))
  );

CREATE POLICY "Support tickets creatable by clients" ON support_tickets
  FOR INSERT WITH CHECK (
    client_id = current_setting('app.current_user_id')::UUID AND
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = support_tickets.organization_id
      AND u.email = auth.email()
      AND om.role = 'client'
    )
  );

CREATE POLICY "Support tickets manageable by support staff" ON support_tickets
  FOR UPDATE USING (
    has_capability('support.manage', organization_id, auth.email()) AND
    is_organization_member(organization_id, auth.email())
  );

-- Notifications policies
CREATE POLICY "Notifications visible to recipient" ON notifications
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::UUID
  );

CREATE POLICY "Notifications updatable by recipient" ON notifications
  FOR UPDATE USING (
    user_id = current_setting('app.current_user_id')::UUID
  );

-- User Preferences policies
CREATE POLICY "User preferences visible to owner" ON user_preferences
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::UUID
  );

CREATE POLICY "User preferences updatable by owner" ON user_preferences
  FOR ALL USING (
    user_id = current_setting('app.current_user_id')::UUID
  );

-- Audit Logs policies (read-only for compliance)
CREATE POLICY "Audit logs visible to organization admins" ON audit_logs
  FOR SELECT USING (
    has_capability('audit.view', organization_id, auth.email()) AND
    is_organization_member(organization_id, auth.email())
  );

-- Insert default capabilities
INSERT INTO capabilities (name, description, category) VALUES
  -- Organization Management
  ('organization.view', 'View organization details', 'organization'),
  ('organization.update', 'Update organization settings', 'organization'),
  ('organization.delete', 'Delete organization', 'organization'),
  ('organization.members.view', 'View organization members', 'organization'),
  ('organization.members.manage', 'Manage organization members', 'organization'),
  ('organization.members.invite', 'Invite new members', 'organization'),
  
  -- Task Management
  ('task.create', 'Create new tasks', 'task'),
  ('task.view.all', 'View all tasks in organization', 'task'),
  ('task.view.own', 'View only own tasks', 'task'),
  ('task.update.all', 'Update any task', 'task'),
  ('task.update.own', 'Update only own tasks', 'task'),
  ('task.delete.all', 'Delete any task', 'task'),
  ('task.delete.own', 'Delete only own tasks', 'task'),
  ('task.assign', 'Assign tasks to users', 'task'),
  ('task.assign.own', 'Assign tasks on own tasks', 'task'),
  
  -- Calendar Management
  ('calendar.view', 'View calendar events', 'calendar'),
  ('calendar.create', 'Create calendar events', 'calendar'),
  ('calendar.update', 'Update calendar events', 'calendar'),
  ('calendar.delete', 'Delete calendar events', 'calendar'),
  ('calendar.manage', 'Full calendar management', 'calendar'),
  
  -- Messaging
  ('message.create', 'Send messages', 'message'),
  ('message.view.internal', 'View internal messages', 'message'),
  ('message.moderate', 'Moderate messages', 'message'),
  
  -- Analytics
  ('analytics.view', 'View analytics data', 'analytics'),
  ('analytics.manage', 'Manage analytics data', 'analytics'),
  ('analytics.export', 'Export analytics data', 'analytics'),
  
  -- Client Services
  ('client.services.view', 'View client services', 'client'),
  ('client.services.manage', 'Manage client services', 'client'),
  ('client.services.sync', 'Sync client service data', 'client'),
  
  -- Support
  ('support.view.all', 'View all support tickets', 'support'),
  ('support.manage', 'Manage support tickets', 'support'),
  ('support.assign', 'Assign support tickets', 'support'),
  
  -- Audit
  ('audit.view', 'View audit logs', 'audit'),
  ('audit.export', 'Export audit logs', 'audit');

-- Insert default role capabilities
INSERT INTO role_capabilities (role, capability_id) 
SELECT 'owner', id FROM capabilities;

INSERT INTO role_capabilities (role, capability_id) 
SELECT 'admin', id FROM capabilities 
WHERE name NOT IN ('organization.delete', 'audit.export');

INSERT INTO role_capabilities (role, capability_id) 
SELECT 'manager', id FROM capabilities 
WHERE name IN (
  'organization.view', 'organization.members.view', 'organization.members.invite',
  'task.create', 'task.view.all', 'task.update.all', 'task.delete.own', 'task.assign',
  'calendar.view', 'calendar.create', 'calendar.update', 'calendar.delete',
  'message.create', 'message.view.internal',
  'analytics.view', 'analytics.export',
  'client.services.view', 'client.services.sync',
  'support.view.all', 'support.manage', 'support.assign',
  'audit.view'
);

INSERT INTO role_capabilities (role, capability_id) 
SELECT 'employee', id FROM capabilities 
WHERE name IN (
  'organization.view',
  'task.create', 'task.view.own', 'task.update.own', 'task.delete.own',
  'calendar.view', 'calendar.create',
  'message.create',
  'analytics.view'
);

INSERT INTO role_capabilities (role, capability_id) 
SELECT 'client', id FROM capabilities 
WHERE name IN (
  'organization.view',
  'task.view.own',
  'calendar.view',
  'message.create'
);
