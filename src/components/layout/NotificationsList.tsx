'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data: { deal_id?: string };
}

export default function NotificationsList() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setNotifications(data);
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    if (loading) return null;
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 z-50 space-y-2">
            {notifications.filter(n => !n.is_read).map((notification) => (
                <div key={notification.id} className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-blue-500 flex justify-between items-start animate-slide-in">
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        {notification.data?.deal_id && (
                            <Link href={`/deals/${notification.data.deal_id}`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                View Deal
                            </Link>
                        )}
                    </div>
                    <button onClick={() => markAsRead(notification.id)} className="text-gray-400 hover:text-gray-600 ml-2">
                        <span className="sr-only">Close</span>
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
}
