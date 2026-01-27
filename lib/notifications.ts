import { supabaseAdmin } from './supabase-admin';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'task' | 'message' | 'system';

export async function sendNotification({
  email,
  title,
  content,
  type,
  actionUrl,
  actionText,
}: {
  email: string;
  title: string;
  content: string;
  type: NotificationType;
  actionUrl?: string;
  actionText?: string;
}) {
  try {
    // 1. Find user by email
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, organization_id')
      .eq('email', email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.warn(`[Notification] User not found for email: ${email}`);
      return;
    }

    const user = users[0];

    // 2. Create notification
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        organization_id: user.organization_id,
        title,
        content,
        type,
        action_url: actionUrl,
        action_text: actionText,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

    if (insertError) {
      console.error('[Notification] Failed to insert notification:', insertError);
    }
  } catch (error) {
    console.error('[Notification] Error sending notification:', error);
  }
}

export async function sendNotifications({
  emails,
  title,
  content,
  type,
  actionUrl,
  actionText,
}: {
  emails: string[];
  title: string;
  content: string;
  type: NotificationType;
  actionUrl?: string;
  actionText?: string;
}) {
  await Promise.all(
    emails.map((email) =>
      sendNotification({ email, title, content, type, actionUrl, actionText })
    )
  );
}
