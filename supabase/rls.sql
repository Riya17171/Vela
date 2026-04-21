-- Vela RLS policies (template)
-- Run after `schema.sql`.

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
  into result;

  return coalesce(result, false);
end;
$$;

-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- categories
alter table public.categories enable row level security;

create policy "categories_select_public"
on public.categories
for select
using (true);

create policy "categories_admin_insert"
on public.categories
for insert
with check (public.is_admin());

create policy "categories_admin_update"
on public.categories
for update
using (public.is_admin())
with check (public.is_admin());

create policy "categories_admin_delete"
on public.categories
for delete
using (public.is_admin());

-- products
alter table public.products enable row level security;

create policy "products_select_public"
on public.products
for select
using (true);

create policy "products_admin_insert"
on public.products
for insert
with check (public.is_admin());

create policy "products_admin_update"
on public.products
for update
using (public.is_admin())
with check (public.is_admin());

create policy "products_admin_delete"
on public.products
for delete
using (public.is_admin());

-- cart_items
alter table public.cart_items enable row level security;

create policy "cart_select_own"
on public.cart_items
for select
using (user_id = auth.uid());

create policy "cart_insert_own"
on public.cart_items
for insert
with check (user_id = auth.uid());

create policy "cart_update_own"
on public.cart_items
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "cart_delete_own"
on public.cart_items
for delete
using (user_id = auth.uid());

-- wishlist_items
alter table public.wishlist_items enable row level security;

create policy "wishlist_select_own"
on public.wishlist_items
for select
using (user_id = auth.uid());

create policy "wishlist_insert_own"
on public.wishlist_items
for insert
with check (user_id = auth.uid());

create policy "wishlist_update_own"
on public.wishlist_items
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "wishlist_delete_own"
on public.wishlist_items
for delete
using (user_id = auth.uid());

-- orders
alter table public.orders enable row level security;

create policy "orders_select_owner_or_admin"
on public.orders
for select
using (user_id = auth.uid() or public.is_admin());

create policy "orders_insert_owner"
on public.orders
for insert
with check (user_id = auth.uid());

create policy "orders_update_owner_or_admin"
on public.orders
for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "orders_delete_owner_or_admin"
on public.orders
for delete
using (user_id = auth.uid() or public.is_admin());

-- order_items
alter table public.order_items enable row level security;

create policy "order_items_select_owner_or_admin"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "order_items_insert_owner_or_admin"
on public.order_items
for insert
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "order_items_update_owner_or_admin"
on public.order_items
for update
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "order_items_delete_owner_or_admin"
on public.order_items
for delete
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

-- reviews
alter table public.reviews enable row level security;

create policy "reviews_select_public"
on public.reviews
for select
using (true);

create policy "reviews_insert_authenticated_own"
on public.reviews
for insert
with check (user_id = auth.uid());

create policy "reviews_update_own"
on public.reviews
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "reviews_delete_own"
on public.reviews
for delete
using (user_id = auth.uid());

-- recently_viewed
alter table public.recently_viewed enable row level security;

create policy "recently_viewed_select_own"
on public.recently_viewed
for select
using (user_id = auth.uid());

create policy "recently_viewed_insert_own"
on public.recently_viewed
for insert
with check (user_id = auth.uid());

create policy "recently_viewed_update_own"
on public.recently_viewed
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "recently_viewed_delete_own"
on public.recently_viewed
for delete
using (user_id = auth.uid());

