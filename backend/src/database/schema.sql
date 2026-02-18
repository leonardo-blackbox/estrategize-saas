-- =============================================================
-- Iris Platform — Database Schema (Story 1.2)
-- Execute no Supabase SQL Editor (ver docs/SUPABASE_SETUP.md)
-- =============================================================

-- ===================== EXTENSIONS ============================
create extension if not exists "uuid-ossp";

-- ===================== PROFILES ==============================
-- Espelha auth.users com dados de perfil da aplicação.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"  on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own"  on public.profiles for insert with check (auth.uid() = id);

-- Trigger: cria perfil automaticamente no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===================== PLANS =================================
create table public.plans (
  id              uuid primary key default uuid_generate_v4(),
  name            text    not null unique,
  description     text,
  price_cents     integer not null default 0,
  credits_per_month integer not null default 0,
  stripe_price_id text    unique,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.plans enable row level security;

-- Planos são públicos (leitura)
create policy "plans_select_all" on public.plans for select using (true);

-- ===================== SUBSCRIPTIONS =========================
create table public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  plan_id             uuid not null references public.plans(id),
  stripe_customer_id  text,
  stripe_subscription_id text unique,
  status              text not null default 'active'
                        check (status in ('active','canceled','past_due','trialing')),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions for update using (auth.uid() = user_id);

-- ===================== CONSULTANCIES =========================
create table public.consultancies (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  sector      text,
  status      text not null default 'draft'
                check (status in ('draft','active','completed','archived')),
  deleted_at  timestamptz,                    -- soft delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.consultancies enable row level security;

create policy "consultancies_select_own" on public.consultancies
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "consultancies_insert_own" on public.consultancies
  for insert with check (auth.uid() = user_id);
create policy "consultancies_update_own" on public.consultancies
  for update using (auth.uid() = user_id);
create policy "consultancies_delete_own" on public.consultancies
  for delete using (auth.uid() = user_id);

-- ===================== CONSULTANCY DIAGNOSTICS ===============
create table public.consultancy_diagnostics (
  id              uuid primary key default uuid_generate_v4(),
  consultancy_id  uuid not null references public.consultancies(id) on delete cascade,
  version         integer not null default 1,
  content         jsonb   not null default '{}',
  generated_by    text    not null default 'ai'
                    check (generated_by in ('ai','user')),
  created_at      timestamptz not null default now()
);

alter table public.consultancy_diagnostics enable row level security;

create policy "diagnostics_select_own" on public.consultancy_diagnostics
  for select using (
    exists (
      select 1 from public.consultancies c
      where c.id = consultancy_id and c.user_id = auth.uid()
    )
  );
create policy "diagnostics_insert_own" on public.consultancy_diagnostics
  for insert with check (
    exists (
      select 1 from public.consultancies c
      where c.id = consultancy_id and c.user_id = auth.uid()
    )
  );

-- ===================== CREDIT TRANSACTIONS ===================
create table public.credit_transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  amount          integer not null,              -- positivo = crédito, negativo = débito
  type            text not null
                    check (type in ('purchase','monthly_grant','reserve','consume','release')),
  status          text not null default 'confirmed'
                    check (status in ('pending','confirmed','released')),
  idempotency_key text unique,                   -- evita duplicatas
  reference_id    text,                          -- ex: consultancy_id, stripe_payment_id
  description     text,
  created_at      timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "credits_select_own" on public.credit_transactions
  for select using (auth.uid() = user_id);
create policy "credits_insert_own" on public.credit_transactions
  for insert with check (auth.uid() = user_id);

-- ===================== AUDIT LOG =============================
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  table_name  text not null,
  record_id   uuid not null,
  action      text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  changed_by  uuid,
  created_at  timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Audit log: somente leitura pelo próprio usuário
create policy "audit_select_own" on public.audit_log
  for select using (auth.uid() = changed_by);

-- Função genérica de audit trigger
create or replace function public.audit_trigger_fn()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    insert into public.audit_log (table_name, record_id, action, old_data, changed_by)
    values (tg_table_name, old.id, tg_op, to_jsonb(old), auth.uid());
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, new.id, tg_op, to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif (tg_op = 'INSERT') then
    insert into public.audit_log (table_name, record_id, action, new_data, changed_by)
    values (tg_table_name, new.id, tg_op, to_jsonb(new), auth.uid());
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Attach audit triggers nas tabelas sensíveis
create trigger audit_consultancies
  after insert or update or delete on public.consultancies
  for each row execute function public.audit_trigger_fn();

create trigger audit_subscriptions
  after insert or update or delete on public.subscriptions
  for each row execute function public.audit_trigger_fn();

create trigger audit_credit_transactions
  after insert or update or delete on public.credit_transactions
  for each row execute function public.audit_trigger_fn();

-- ===================== UPDATED_AT TRIGGER ====================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger set_updated_at_consultancies
  before update on public.consultancies
  for each row execute function public.set_updated_at();

-- ===================== INDEXES ===============================
create index idx_consultancies_user_id on public.consultancies(user_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_credit_transactions_user_id on public.credit_transactions(user_id);
create index idx_credit_transactions_idempotency on public.credit_transactions(idempotency_key);
create index idx_audit_log_record on public.audit_log(table_name, record_id);
