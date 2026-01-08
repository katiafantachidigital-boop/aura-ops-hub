-- Add client_id column to client_feedbacks to link feedback to clients
ALTER TABLE public.client_feedbacks 
ADD COLUMN client_id uuid REFERENCES public.clients(id);

-- Create index for better performance
CREATE INDEX idx_client_feedbacks_client_id ON public.client_feedbacks(client_id);