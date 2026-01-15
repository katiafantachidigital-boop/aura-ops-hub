-- Alter sales_events to support daily summary format
ALTER TABLE public.sales_events 
ADD COLUMN IF NOT EXISTS sales_quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_pix integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_credit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_debit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_boleto integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_cash integer DEFAULT 0;

-- Update description to be optional (already nullable)
COMMENT ON COLUMN public.sales_events.sales_quantity IS 'Number of sales made';
COMMENT ON COLUMN public.sales_events.payment_pix IS 'Number of sales paid via PIX';
COMMENT ON COLUMN public.sales_events.payment_credit IS 'Number of sales paid via credit card';
COMMENT ON COLUMN public.sales_events.payment_debit IS 'Number of sales paid via debit card';
COMMENT ON COLUMN public.sales_events.payment_boleto IS 'Number of sales paid via boleto';
COMMENT ON COLUMN public.sales_events.payment_cash IS 'Number of sales paid via cash';