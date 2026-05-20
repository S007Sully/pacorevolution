
-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  bio text,
  location text,
  membership_tier text default 'initiate',
  avatar_url text,
  photos text[] default '{}',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles viewable by authenticated" on public.profiles for select to authenticated using (true);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  date timestamptz not null,
  location text,
  image_url text,
  price numeric default 0,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "events viewable by authenticated" on public.events for select to authenticated using (true);

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text,
  media_url text,
  media_type text,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "users read own messages" on public.messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "users send messages" on public.messages for insert to authenticated with check (auth.uid() = sender_id);
create index on public.messages (sender_id, receiver_id, created_at);

-- tickets
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_status text default 'pending',
  payment_link text,
  created_at timestamptz default now()
);
alter table public.tickets enable row level security;
create policy "users view own tickets" on public.tickets for select to authenticated using (auth.uid() = user_id);
create policy "users create own tickets" on public.tickets for insert to authenticated with check (auth.uid() = user_id);

-- auto profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- storage buckets
insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('message-media', 'message-media', false) on conflict do nothing;

-- profile-photos policies
create policy "profile photos public read" on storage.objects for select using (bucket_id = 'profile-photos');
create policy "users upload own profile photos" on storage.objects for insert to authenticated with check (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users update own profile photos" on storage.objects for update to authenticated using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users delete own profile photos" on storage.objects for delete to authenticated using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- message-media policies
create policy "users read own message media" on storage.objects for select to authenticated using (bucket_id = 'message-media' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users upload own message media" on storage.objects for insert to authenticated with check (bucket_id = 'message-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- seed sample events
insert into public.events (name, description, date, location, image_url, price) values
('NOIR — Opening Night', 'An exclusive black-tie soirée at the heart of the city. Champagne, low light, and a curated guestlist.', now() + interval '14 days', 'Penthouse 47, Manhattan', null, 250),
('Velvet Hours', 'Late-night cocktails and live jazz in an intimate underground lounge.', now() + interval '21 days', 'The Cellar, SoHo', null, 120),
('Crimson Yacht', 'Sunset yacht experience with the Paco Revolution inner circle.', now() + interval '30 days', 'Marina Bay', null, 480);
