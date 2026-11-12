CREATE TABLE public.image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 1 AND 10000),
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('nvidia', 'hf')),
  generation_type TEXT NOT NULL CHECK (generation_type IN ('text-to-image', 'image-to-image', 'chat')),
  image_path TEXT NOT NULL,
  original_image_path TEXT,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  width INTEGER CHECK (width IS NULL OR width BETWEEN 1 AND 4096),
  height INTEGER CHECK (height IS NULL OR height BETWEEN 1 AND 4096),
  seed BIGINT CHECK (seed IS NULL OR seed BETWEEN 0 AND 4294967295),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own image generations"
  ON public.image_generations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own image generations"
  ON public.image_generations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users delete own image generations"
  ON public.image_generations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX image_generations_user_created_idx
  ON public.image_generations (user_id, created_at DESC);

CREATE INDEX image_generations_session_created_idx
  ON public.image_generations (user_id, session_id, created_at);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('image-library', 'image-library', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users read own image library files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'image-library'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users upload own image library files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'image-library'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users update own image library files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'image-library'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'image-library'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users delete own image library files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'image-library'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );