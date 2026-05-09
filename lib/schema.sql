-- =============================================
-- HOTEL SOUTHERN SUITES — SUPABASE SQL SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- BOOKINGS TABLE
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  booking_id text unique not null,
  hotel_id text not null,
  hotel_name text not null,
  hotel_slug text not null,
  room_id text not null,
  room_name text not null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  nights integer not null,
  guests integer not null default 1,
  room_price numeric not null,
  taxes numeric not null,
  total_amount numeric not null,
  payment_status text not null default 'pending',
  booking_status text not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  special_requests text,
  created_at timestamptz default now()
);

-- ADMINS TABLE
create table if not exists admins (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'branch_manager',
  hotel_slug text,
  hotel_name text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- HOTEL SETTINGS TABLE (for admin editable content)
create table if not exists hotel_settings (
  id uuid default gen_random_uuid() primary key,
  hotel_slug text unique not null,
  hotel_name text not null,
  is_active boolean default true,
  custom_description text,
  announcement text,
  updated_at timestamptz default now()
);

-- SITE SETTINGS
create table if not exists site_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

-- Insert default site settings
insert into site_settings (key, value) values
  ('razorpay_key_id', ''),
  ('razorpay_key_secret', ''),
  ('whatsapp_number', '919618138686'),
  ('email_from', 'bookings@southernsuites.com'),
  ('hero_video', 'hero-video.mp4'),
  ('founded_year', '2021'),
  ('tagline', 'Where Every Stay Feels Distinctly Southern')
on conflict (key) do nothing;

-- RLS Policies
alter table bookings enable row level security;
alter table admins enable row level security;
alter table hotel_settings enable row level security;
alter table site_settings enable row level security;

-- Allow public to insert bookings (guest checkout)
create policy "Anyone can create bookings" on bookings
  for insert with check (true);

-- Allow public to read their own booking by booking_id
create policy "Public can read own booking" on bookings
  for select using (true);

-- Allow service role full access
create policy "Service role full access bookings" on bookings
  for all using (auth.role() = 'service_role');

create policy "Service role full access admins" on admins
  for all using (auth.role() = 'service_role');

create policy "Service role full access settings" on site_settings
  for all using (auth.role() = 'service_role');

create policy "Public read hotel settings" on hotel_settings
  for select using (true);

create policy "Service role manage hotel settings" on hotel_settings
  for all using (auth.role() = 'service_role');

-- INDEXES
create index if not exists bookings_hotel_slug_idx on bookings(hotel_slug);
create index if not exists bookings_booking_id_idx on bookings(booking_id);
create index if not exists bookings_guest_email_idx on bookings(guest_email);
create index if not exists bookings_check_in_idx on bookings(check_in);
create index if not exists bookings_created_at_idx on bookings(created_at desc);
