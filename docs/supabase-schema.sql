create table if not exists public.listings (
    id text primary key,
    address text not null,
    neighbourhood text not null,
    zipcode text not null,
    latitude double precision not null,
    longitude double precision not null,
    property_type text not null check (
        property_type in (
            'single-family',
            'condo',
            'townhouse',
            'multi-family'
        )
    ),
    list_price integer not null check (list_price >= 0),
    beds integer not null check (beds >= 0),
    baths numeric(3, 1) not null check (baths >= 0),
    year_built integer not null check (year_built >= 1700),
    sqft integer not null check (sqft > 0),
    days_on_market integer not null check (days_on_market >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

drop policy if exists "Public read demo listings" on public.listings;

create policy "Public read demo listings"
on public.listings
for select
to anon
using (true);
