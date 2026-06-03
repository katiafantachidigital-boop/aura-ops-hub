
-- Folders for organizing media
CREATE TABLE public.media_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.media_folders(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage folders" ON public.media_folders
  FOR ALL USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TRIGGER trg_media_folders_updated
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Files in media library
CREATE TABLE public.media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text,
  file_type text NOT NULL, -- 'image' | 'video' | 'document'
  size_bytes bigint,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_files TO authenticated;
GRANT ALL ON public.media_files TO service_role;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage media files" ON public.media_files
  FOR ALL USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TRIGGER trg_media_files_updated
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_media_files_folder ON public.media_files(folder_id);
CREATE INDEX idx_media_folders_parent ON public.media_folders(parent_id);
