import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadTrainings() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Subscribe to realtime updates for new trainings
    const trainingsChannel = supabase
      .channel('unread-trainings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trainings'
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
          table: 'training_reads'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(trainingsChannel);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Get total trainings
      const { count: totalCount, error: totalError } = await supabase
        .from('trainings')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get read trainings by this user
      const { count: readCount, error: readError } = await supabase
        .from('training_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (readError) throw readError;

      setUnreadCount(Math.max(0, (totalCount || 0) - (readCount || 0)));
    } catch (error) {
      console.error('Error fetching unread trainings count:', error);
    }
  };

  const markAsRead = async (trainingId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('training_reads')
        .upsert({
          training_id: trainingId,
          user_id: user.id,
        }, { onConflict: 'training_id,user_id' });

      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking training as read:', error);
    }
  };

  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  return { unreadCount, refreshUnreadCount, markAsRead };
}