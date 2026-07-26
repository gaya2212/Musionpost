-- profiles.slug exists in the schema but nothing has ever populated it —
-- needed for /discover/[proSlug] public profile links (MVP_ARCHITECTURE.md
-- Section 9: "Slug generation: slugify(display_name) + '-' + short_uuid on
-- profile create"). Generates it in the same trigger that already creates
-- the profile row on signup, and backfills existing profiles that predate
-- this change. Run this in the Supabase SQL editor.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_slug text;
begin
  base_slug := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name', 'new-user'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'user';
  end if;

  insert into public.profiles (id, display_name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'New user'),
    base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8)
  );
  return new;
end;
$$;

-- Backfill profiles created before this trigger existed.
update public.profiles
set slug = lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(replace(id::text, '-', ''), 1, 8)
where slug is null;
