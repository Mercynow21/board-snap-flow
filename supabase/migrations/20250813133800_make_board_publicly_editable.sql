-- Make the board publicly editable by allowing anonymous users to perform all actions.

-- Allow public access to cards
DROP POLICY IF EXISTS "Insert cards only by project owner" ON public.cards;
DROP POLICY IF EXISTS "Update cards only by project owner" ON public.cards;
DROP POLICY IF EXISTS "Delete cards only by project owner" ON public.cards;

CREATE POLICY "Allow public insert on cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cards" ON public.cards FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on cards" ON public.cards FOR DELETE USING (true);

-- Allow public access to columns
DROP POLICY IF EXISTS "Insert columns only by project owner" ON public.columns;
DROP POLICY IF EXISTS "Update columns only by project owner" ON public.columns;
DROP POLICY IF EXISTS "Delete columns only by project owner" ON public.columns;

CREATE POLICY "Allow public insert on columns" ON public.columns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on columns" ON public.columns FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on columns" ON public.columns FOR DELETE USING (true);
