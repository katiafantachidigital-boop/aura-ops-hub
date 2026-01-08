-- Create table for training questions
CREATE TABLE public.training_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.training_contents(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for question options/alternatives
CREATE TABLE public.training_question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.training_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user answers
CREATE TABLE public.training_user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.training_questions(id) ON DELETE CASCADE,
  selected_option_id UUID NOT NULL REFERENCES public.training_question_options(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_user_answers ENABLE ROW LEVEL SECURITY;

-- RLS for training_questions
CREATE POLICY "Everyone can view training questions" 
ON public.training_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Gestoras can manage training questions" 
ON public.training_questions 
FOR ALL 
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- RLS for training_question_options
CREATE POLICY "Everyone can view question options" 
ON public.training_question_options 
FOR SELECT 
USING (true);

CREATE POLICY "Gestoras can manage question options" 
ON public.training_question_options 
FOR ALL 
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- RLS for training_user_answers
CREATE POLICY "Users can insert their own answers" 
ON public.training_user_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers" 
ON public.training_user_answers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Gestoras can view all answers" 
ON public.training_user_answers 
FOR SELECT 
USING (is_manager(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_training_questions_content ON public.training_questions(content_id);
CREATE INDEX idx_training_options_question ON public.training_question_options(question_id);
CREATE INDEX idx_training_answers_user ON public.training_user_answers(user_id);
CREATE INDEX idx_training_answers_question ON public.training_user_answers(question_id);