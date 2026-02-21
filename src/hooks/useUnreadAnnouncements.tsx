import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadAnnouncements() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Subscribe to realtime updates for new announcements
    const announcementsChannel = supabase
      .channel('unread-announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcement_reads'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Get total announcements
      const { count: totalCount, error: totalError } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get read announcements by this user
      const { count: readCount, error: readError } = await supabase
        .from('announcement_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (readError) throw readError;

      setUnreadCount(Math.max(0, (totalCount || 0) - (readCount || 0)));
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  return { unreadCount, refreshUnreadCount };
}
