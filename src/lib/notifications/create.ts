import { supabaseAdmin } from '@/lib/supabase/admin';

interface CreateNotificationParams {
  tenantId: string;
  userId?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'maintenance' | 'payment' | 'lease' | 'lead';
  title: string;
  message?: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { tenantId, userId, type, title, message, link } = params;

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      type,
      title,
      message,
      link,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create notification:', error);
    return null;
  }

  return data;
}
