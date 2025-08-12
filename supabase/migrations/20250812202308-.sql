-- Tighten RLS: make public projects read-only for non-owners
-- Cards policies
DROP POLICY IF EXISTS "Insert cards into public or owned projects" ON public.cards;
DROP POLICY IF EXISTS "Update cards in owned projects or public demo" ON public.cards;
DROP POLICY IF EXISTS "Delete cards in owned projects or public demo" ON public.cards;

-- Keep existing SELECT policy as-is (public readable or owner)

CREATE POLICY "Insert cards only by project owner"
ON public.cards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = cards.project_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Update cards only by project owner"
ON public.cards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = cards.project_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = cards.project_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Delete cards only by project owner"
ON public.cards
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = cards.project_id AND p.owner_id = auth.uid()
  )
);

-- Columns policies
DROP POLICY IF EXISTS "Insert columns into public or owned projects" ON public.columns;
DROP POLICY IF EXISTS "Update columns in owned projects or public demo" ON public.columns;
DROP POLICY IF EXISTS "Delete columns in owned projects or public demo" ON public.columns;

-- Keep existing SELECT policy as-is (public readable or owner)

CREATE POLICY "Insert columns only by project owner"
ON public.columns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = columns.project_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Update columns only by project owner"
ON public.columns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = columns.project_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = columns.project_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Delete columns only by project owner"
ON public.columns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = columns.project_id AND p.owner_id = auth.uid()
  )
);