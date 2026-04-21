-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products
create table products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price numeric not null,
  category text not null,
  image_url text,
  rating numeric default 0,
  rating_count integer default 0,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Cart Items
create table cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 4. Wishlist Items
create table wishlist_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 5. Orders
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending',
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Order Items
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete restrict not null,
  quantity integer not null,
  price_at_purchase numeric not null
);

-- 7. Reviews
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Recently Viewed
create table recently_viewed (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- Categories (admin only, but standard list)
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null,
  image_url text
);

-- RLS Settings
alter table profiles enable row level security;
alter table products enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table recently_viewed enable row level security;
alter table categories enable row level security;

-- Policies --
-- Profiles: User can view/edit their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Product & Categories: Public read
create policy "Products are viewable by everyone" on products for select using (true);
create policy "Categories are viewable by everyone" on categories for select using (true);

-- Cart: User owns their cart
create policy "Users can manage own cart" on cart_items for all using (auth.uid() = user_id);

-- Wishlist: User owns wishlist
create policy "Users can manage own wishlist" on wishlist_items for all using (auth.uid() = user_id);

-- Orders
create policy "Users can manage own orders" on orders for all using (auth.uid() = user_id);
create policy "Users can manage own order items" on order_items for all using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- Reviews
create policy "Reviews viewable by everyone" on reviews for select using (true);
create policy "Authenticated users can create reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users can manage own reviews" on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews" on reviews for delete using (auth.uid() = user_id);

-- Recently viewed
create policy "Users can manage own view history" on recently_viewed for all using (auth.uid() = user_id);

-- Storage bucket creation for product images 
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
create policy "Public Access to Images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Auth Users Upload" on storage.objects for insert with check ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Automatic profile creation trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call profile creation on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
