-- =============================================
-- HOTEL SOUTHERN SUITES — COMPLETE SCHEMA
-- Run this fresh in Supabase SQL Editor
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
  rooms_count integer not null default 1,
  room_price numeric not null,
  taxes numeric not null,
  total_amount numeric not null,
  discount_amount numeric default 0,
  promo_code text,
  invoice_number text,
  gst_number text,
  payment_status text not null default 'pending',
  booking_status text not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
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

-- HOTEL SETTINGS TABLE
create table if not exists hotel_settings (
  id uuid default gen_random_uuid() primary key,
  hotel_slug text unique not null,
  hotel_name text not null,
  is_active boolean default true,
  custom_description text,
  phone text,
  maps_link text,
  announcement text,
  amenities jsonb,
  highlights jsonb,
  rooms jsonb,
  images jsonb,
  updated_at timestamptz default now()
);

-- ROOM RATES TABLE
create table if not exists room_rates (
  id uuid default gen_random_uuid() primary key,
  hotel_slug text not null,
  room_id text not null,
  price numeric not null,
  original_price numeric,
  updated_at timestamptz default now(),
  unique(hotel_slug, room_id)
);

-- ROOM INVENTORY TABLE
create table if not exists room_inventory (
  id uuid default gen_random_uuid() primary key,
  hotel_slug text not null,
  room_id text not null,
  total_rooms integer not null default 5,
  updated_at timestamptz default now(),
  unique(hotel_slug, room_id)
);

-- ROOM AVAILABILITY TABLE
create table if not exists room_availability (
  id uuid default gen_random_uuid() primary key,
  hotel_slug text not null,
  room_id text not null,
  date date not null,
  rooms_booked integer not null default 1,
  booking_id text,
  created_at timestamptz default now()
);

-- SITE SETTINGS TABLE
create table if not exists site_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

-- PROMO CODES TABLE
create table if not exists promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text not null default 'percentage',
  discount_value numeric not null,
  min_amount numeric default 0,
  max_uses integer,
  used_count integer default 0,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Insert default site settings
insert into site_settings (key, value) values
  ('whatsapp_number', '919618138686'),
  ('email_from', 'bookings@southernsuites.com'),
  ('founded_year', '2021'),
  ('tagline', 'Where Every Stay Feels Distinctly Southern')
on conflict (key) do nothing;

-- DISABLE RLS (server-side only app)
alter table bookings disable row level security;
alter table admins disable row level security;
alter table hotel_settings disable row level security;
alter table site_settings disable row level security;
alter table room_rates disable row level security;
alter table room_inventory disable row level security;
alter table room_availability disable row level security;
alter table promo_codes disable row level security;

-- STORAGE
insert into storage.buckets (id, name, public)
values ('hotel-images', 'hotel-images', true)
on conflict (id) do update set public = true;

-- INDEXES
create index if not exists bookings_hotel_slug_idx on bookings(hotel_slug);
create index if not exists bookings_booking_id_idx on bookings(booking_id);
create index if not exists bookings_guest_email_idx on bookings(guest_email);
create index if not exists bookings_check_in_idx on bookings(check_in);
create index if not exists bookings_created_at_idx on bookings(created_at desc);
create index if not exists room_availability_date_idx on room_availability(hotel_slug, room_id, date);