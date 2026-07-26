-- Adds public.messages to the supabase_realtime publication. Without this,
-- postgres_changes subscriptions on the messages table (used for live
-- thread updates in /messages) never fire — it isn't the default for new
-- tables. Run this in the Supabase SQL editor.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
