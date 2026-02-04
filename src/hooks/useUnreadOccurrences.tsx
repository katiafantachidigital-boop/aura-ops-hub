import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadOccurrences() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Subscribe to realtime updates for new occurrences
    const occurrencesChannel = supabase
      .channel('unread-occurrences')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'occurrences'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(occurrencesChannel);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Get occurrences that the user can see (RLS will filter)
      const { data: occurrences, error: occError } = await supabase
        .from('occurrences')
        .select('id');

      if (occError) throw occError;

      // Get read occurrences by this user
      const { data: readOccurrences, error: readError } = await supabase
        .from('occurrence_reads')
        .select('occurrence_id')
        .eq('user_id', user.id);

      if (readError) throw readError;

      const readIds = new Set(readOccurrences?.map(r => r.occurrence_id) || []);
      const unreadOccurrences = (occurrences || []).filter(o => !readIds.has(o.id));

      setUnreadCount(unreadOccurrences.length);
    } catch (error) {
      console.error('Error fetching unread occurrences count:', error);
    }
  };

  const markAsRead = async (occurrenceId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('occurrence_reads')
        .upsert({
          occurrence_id: occurrenceId,
          user_id: user.id,
        }, { onConflict: 'occurrence_id,user_id' });

      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking occurrence as read:', error);
    }
  };

  const markAllAsRead = async (occurrenceIds: string[]) => {
    if (!user || occurrenceIds.length === 0) return;

    try {
      const inserts = occurrenceIds.map(id => ({
        occurrence_id: id,
        user_id: user.id,
      }));

      await supabase
        .from('occurrence_reads')
        .upsert(inserts, { onConflict: 'occurrence_id,user_id' });

      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking occurrences as read:', error);
    }
  };

  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  return { unreadCount, refreshUnreadCount, markAsRead, markAllAsRead };
}