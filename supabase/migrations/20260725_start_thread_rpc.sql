-- Adds public.start_thread(other_profile_id uuid), a SECURITY DEFINER RPC
-- for creating a new direct message thread.
--
-- The "message_threads: manage participant" RLS policy requires a
-- thread_participants row to already reference a thread before that thread
-- can be inserted — but thread_participants.thread_id has a foreign key
-- requiring the thread to exist first. Neither insert order can satisfy
-- both constraints from the client, so this is a hard deadlock as the
-- schema stands: there is no way to create a brand-new thread via normal
-- RLS-governed inserts. This function creates the thread and both
-- participant rows atomically, bypassing that deadlock, and reuses an
-- existing direct (non-project) thread between the two people if one
-- already exists. Run this in the Supabase SQL editor.

create or replace function public.start_thread(other_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  existing_thread_id uuid;
  new_thread_id uuid;
begin
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  if other_profile_id = caller_id then
    raise exception 'Cannot start a thread with yourself';
  end if;

  if not exists (select 1 from public.profiles where id = other_profile_id) then
    raise exception 'Recipient profile does not exist';
  end if;

  select mt.id into existing_thread_id
  from public.message_threads mt
  where mt.project_id is null
    and exists (select 1 from public.thread_participants tp where tp.thread_id = mt.id and tp.profile_id = caller_id)
    and exists (select 1 from public.thread_participants tp where tp.thread_id = mt.id and tp.profile_id = other_profile_id)
    and (select count(*) from public.thread_participants tp where tp.thread_id = mt.id) = 2
  limit 1;

  if existing_thread_id is not null then
    return existing_thread_id;
  end if;

  insert into public.message_threads default values returning id into new_thread_id;

  insert into public.thread_participants (thread_id, profile_id)
  values (new_thread_id, caller_id), (new_thread_id, other_profile_id);

  return new_thread_id;
end;
$$;

-- mark_thread_read: the "messages: update own" policy only lets the
-- *sender* update a message, so a recipient can never set read_at on a
-- message sent to them under plain RLS. Adding a second permissive UPDATE
-- policy would OR together with the sender policy and let any participant
-- edit any column (including body) on someone else's message, not just
-- read_at — so this is a SECURITY DEFINER function scoped to exactly the
-- one column instead.
create or replace function public.mark_thread_read(target_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = target_thread_id and tp.profile_id = caller_id
  ) then
    raise exception 'Not a participant in this thread';
  end if;

  update public.messages
  set read_at = now()
  where thread_id = target_thread_id
    and sender_profile_id != caller_id
    and read_at is null;
end;
$$;
