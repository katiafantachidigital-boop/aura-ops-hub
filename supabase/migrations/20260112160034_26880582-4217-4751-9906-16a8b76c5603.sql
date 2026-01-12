-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL
);

-- Create announcement reads tracking table
CREATE TABLE public.announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements policies: everyone can read, only managers can insert/update/delete
CREATE POLICY "Anyone can view announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only managers can create announcements"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Only managers can update announcements"
ON public.announcements FOR UPDATE
TO authenticated
USING (public.is_manager(auth.uid()));

CREATE POLICY "Only managers can delete announcements"
ON public.announcements FOR DELETE
TO authenticated
USING (public.is_manager(auth.uid()));

-- Announcement reads policies
CREATE POLICY "Users can view their own reads"
ON public.announcement_reads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark as read"
ON public.announcement_reads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for announcement files
INSERT INTO storage.buckets (id, name, public) VALUES ('announcements', 'announcements', true);

-- Storage policies
CREATE POLICY "Anyone can view announcement files"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

CREATE POLICY "Only managers can upload announcement files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'announcements' AND public.is_manager(auth.uid()));

CREATE POLICY "Only managers can delete announcement files"
ON storage.objects FOR DELETE
USING (bucket_id = 'announcements' AND public.is_manager(auth.uid()));

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;