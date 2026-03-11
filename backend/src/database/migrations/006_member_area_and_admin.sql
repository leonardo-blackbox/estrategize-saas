-- =============================================================
-- Migration 006 — Member Area + Admin Console (Epic 2)
-- Story 2.1: Schema, Migrations & RLS
-- =============================================================

-- ─── PROFILES: adicionar role de admin ────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'member'
    check (role in ('member', 'admin'));

comment on column public.profiles.role is
  'admin = acesso ao /admin console. member = usuário padrão.';

-- ─── COURSES ──────────────────────────────────────────────────
create table public.courses (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  cover_url    text,
  status       text not null default 'draft'
                 check (status in ('draft', 'published', 'archived')),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.courses enable row level security;

-- Cursos publicados: qualquer autenticado pode ver
create policy "courses_select_published" on public.courses
  for select using (
    status = 'published'
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Apenas admin pode modificar
create policy "courses_admin_all" on public.courses
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

comment on table public.courses is 'Catálogo de cursos da plataforma.';

-- ─── MODULES ──────────────────────────────────────────────────
create table public.modules (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  sort_order   integer not null default 0,
  drip_days    integer not null default 0
                 check (drip_days >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "modules_select_via_course" on public.modules
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.status = 'published'
             or (select role from public.profiles where id = auth.uid()) = 'admin')
    )
  );

create policy "modules_admin_all" on public.modules
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

comment on table public.modules is 'Módulos/temporadas de um curso.';

-- ─── LESSONS ──────────────────────────────────────────────────
create table public.lessons (
  id             uuid primary key default uuid_generate_v4(),
  module_id      uuid not null references public.modules(id) on delete cascade,
  title          text not null,
  description    text,
  video_url      text,
  duration_secs  integer,
  sort_order     integer not null default 0,
  drip_days      integer not null default 0
                   check (drip_days >= 0),
  is_free_preview boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons_select_via_module" on public.lessons
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (c.status = 'published'
             or (select role from public.profiles where id = auth.uid()) = 'admin')
    )
  );

create policy "lessons_admin_all" on public.lessons
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

comment on table public.lessons is 'Aulas/episódios de um módulo.';

-- ─── LESSON ATTACHMENTS ───────────────────────────────────────
create table public.lesson_attachments (
  id          uuid primary key default uuid_generate_v4(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  title       text not null,
  file_url    text not null,
  file_type   text,
  file_size   integer,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.lesson_attachments enable row level security;

create policy "attachments_select_authenticated" on public.lesson_attachments
  for select using (auth.uid() is not null);

create policy "attachments_admin_all" on public.lesson_attachments
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ─── COLLECTIONS (tags para carrosséis) ──────────────────────
create table public.collections (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "collections_select_authenticated" on public.collections
  for select using (auth.uid() is not null);

create policy "collections_admin_all" on public.collections
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ─── COURSE COLLECTIONS (relação N:N) ────────────────────────
create table public.course_collections (
  course_id      uuid not null references public.courses(id) on delete cascade,
  collection_id  uuid not null references public.collections(id) on delete cascade,
  sort_order     integer not null default 0,
  primary key (course_id, collection_id)
);

alter table public.course_collections enable row level security;

create policy "course_collections_select_authenticated" on public.course_collections
  for select using (auth.uid() is not null);

create policy "course_collections_admin_all" on public.course_collections
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ─── PLAN ENTITLEMENTS (plano → cursos liberados) ─────────────
create table public.plan_entitlements (
  id            uuid primary key default uuid_generate_v4(),
  plan_id       uuid not null references public.plans(id) on delete cascade,
  course_id     uuid references public.courses(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint plan_entitlements_target_check
    check (
      (course_id is not null and collection_id is null) or
      (course_id is null and collection_id is not null)
    )
);

alter table public.plan_entitlements enable row level security;

create policy "plan_entitlements_select_authenticated" on public.plan_entitlements
  for select using (auth.uid() is not null);

create policy "plan_entitlements_admin_all" on public.plan_entitlements
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ─── USER ENTITLEMENTS (overrides individuais) ────────────────
create table public.user_entitlements (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete cascade,
  module_id   uuid references public.modules(id) on delete cascade,
  lesson_id   uuid references public.lessons(id) on delete cascade,
  access      text not null check (access in ('allow', 'deny', 'full_access')),
  expires_at  timestamptz,
  granted_by  uuid references public.profiles(id),
  reason      text,
  created_at  timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

-- Usuário vê apenas seus próprios entitlements
create policy "user_entitlements_select_own" on public.user_entitlements
  for select using (
    auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "user_entitlements_admin_all" on public.user_entitlements
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

comment on table public.user_entitlements is
  'Overrides individuais de acesso. access=full_access quebra drip.';

-- ─── ENROLLMENTS (matrícula + drip tracking) ──────────────────
create table public.enrollments (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  enrolled_at      timestamptz not null default now(),
  expires_at       timestamptz,
  source           text not null default 'manual'
                     check (source in ('webhook', 'manual', 'plan', 'admin')),
  webhook_event_id uuid,
  unique (user_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "enrollments_select_own" on public.enrollments
  for select using (
    auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "enrollments_admin_all" on public.enrollments
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

comment on table public.enrollments is
  'Matrícula do usuário num curso. enrolled_at é o marco para cálculo de drip.';

-- ─── LESSON PROGRESS ──────────────────────────────────────────
create table public.lesson_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  watched_secs  integer not null default 0,
  completed     boolean not null default false,
  completed_at  timestamptz,
  last_watched  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "lesson_progress_select_own" on public.lesson_progress
  for select using (
    auth.uid() = user_id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "lesson_progress_upsert_own" on public.lesson_progress
  for insert with check (auth.uid() = user_id);

create policy "lesson_progress_update_own" on public.lesson_progress
  for update using (auth.uid() = user_id);

create policy "lesson_progress_admin_all" on public.lesson_progress
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ─── WEBHOOK EVENTS ───────────────────────────────────────────
create table public.webhook_events (
  id           uuid primary key default uuid_generate_v4(),
  provider     text not null check (provider in ('stripe', 'hotmart', 'kiwify', 'other')),
  event_type   text not null,
  event_id     text not null,
  payload      jsonb not null default '{}',
  status       text not null default 'pending'
                 check (status in ('pending', 'processing', 'processed', 'failed', 'skipped')),
  error        text,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.webhook_events enable row level security;

-- Apenas admin pode ver webhook events
create policy "webhook_events_admin_select" on public.webhook_events
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Backend usa service_role para inserir/atualizar (sem RLS via service_role key)

comment on table public.webhook_events is
  'Log de todos os webhooks recebidos. event_id garante idempotência.';

-- ─── AUDIT LOGS ───────────────────────────────────────────────
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id),
  actor_email text,
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select" on public.audit_logs
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

comment on table public.audit_logs is
  'Audit trail de ações admin e eventos críticos do sistema.';

-- ─── INDEXES (performance) ────────────────────────────────────
create index if not exists idx_modules_course_id
  on public.modules (course_id, sort_order);

create index if not exists idx_lessons_module_id
  on public.lessons (module_id, sort_order);

create index if not exists idx_enrollments_user_id
  on public.enrollments (user_id);

create index if not exists idx_lesson_progress_user_id
  on public.lesson_progress (user_id);

create index if not exists idx_lesson_progress_lesson_id
  on public.lesson_progress (lesson_id);

create index if not exists idx_user_entitlements_user_id
  on public.user_entitlements (user_id);

create index if not exists idx_webhook_events_event_id
  on public.webhook_events (event_id, provider);

create index if not exists idx_webhook_events_status
  on public.webhook_events (status, created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (actor_id, created_at desc);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create trigger modules_updated_at before update on public.modules
  for each row execute function public.set_updated_at();

create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

-- ─── SEED: coleções padrão ────────────────────────────────────
insert into public.collections (name, slug, description, sort_order) values
  ('Continue assistindo', 'continue-assistindo', 'Cursos em progresso', 1),
  ('Cursos liberados',    'cursos-liberados',    'Todos os cursos do seu plano', 2),
  ('Cursos bloqueados',   'cursos-bloqueados',   'Disponíveis em planos superiores', 3),
  ('Recomendações',       'recomendacoes',       'Trilhas sugeridas para você', 4)
on conflict (slug) do nothing;

-- ─── ADMIN BOOTSTRAP ─────────────────────────────────────────
-- Executar após criação: UPDATE profiles SET role='admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'seu@email.com');
