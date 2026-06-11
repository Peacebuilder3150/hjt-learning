-- =====================================================================
-- HJTメソッド™学習コンテンツ 初期設定SQL
--
-- 使い方:
--   1. このファイルの一番下にある「運営者アカウント」のメールアドレスを
--      あなたのメールアドレスに書き換える(★印の行)
--   2. Supabaseの管理画面 → SQL Editor → 全文を貼り付けて「Run」
-- =====================================================================

-- ---------- 保管場所(テーブル)づくり ----------

-- 会員
create table public.members (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  name          text not null,
  email         text not null unique,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- コース
create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- テーマ(コース内の章)
create table public.themes (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 動画
create table public.videos (
  id            uuid primary key default gen_random_uuid(),
  theme_id      uuid not null references public.themes(id) on delete cascade,
  title         text not null,
  youtube_url   text not null,
  thumbnail_url text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- 受講コースの割り当て
create table public.enrollments (
  member_id  uuid not null references public.members(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, course_id)
);

-- 視聴記録(進捗のもと)
create table public.progress (
  member_id    uuid not null references public.members(id) on delete cascade,
  video_id     uuid not null references public.videos(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (member_id, video_id)
);

-- ---------- 判定用の関数 ----------

-- いまログインしている人が運営者かどうか
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce(
    (select m.is_admin from members m where m.auth_user_id = auth.uid()),
    false
  );
$$;

-- いまログインしている人の会員ID
create or replace function public.current_member_id() returns uuid
language sql security definer set search_path = public stable as $$
  select m.id from members m where m.auth_user_id = auth.uid();
$$;

-- いまログインしている人がそのコースを受講しているか
create or replace function public.is_enrolled(p_course uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from enrollments e
    join members m on m.id = e.member_id
    where m.auth_user_id = auth.uid() and e.course_id = p_course
  );
$$;

-- いまログインしている人がそのテーマのコースを受講しているか
create or replace function public.is_enrolled_theme(p_theme uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from themes t
    where t.id = p_theme and public.is_enrolled(t.course_id)
  );
$$;

-- ---------- 初回パスワード登録のとき、会員情報と自動でひも付け ----------
-- 事前に会員登録されていないメールアドレスでは登録できない仕組み

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update members set auth_user_id = new.id
  where lower(email) = lower(new.email) and auth_user_id is null;
  if not found then
    raise exception 'このメールアドレスは会員登録されていません';
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------- 閲覧・編集の権限(会員は自分の受講コースだけ見られる) ----------

alter table public.members enable row level security;
create policy members_select on public.members
  for select using (public.is_admin() or auth_user_id = auth.uid());
create policy members_insert on public.members
  for insert with check (public.is_admin());
create policy members_update on public.members
  for update using (public.is_admin());
create policy members_delete on public.members
  for delete using (public.is_admin());

alter table public.courses enable row level security;
create policy courses_select on public.courses
  for select using (public.is_admin() or public.is_enrolled(id));
create policy courses_write on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.themes enable row level security;
create policy themes_select on public.themes
  for select using (public.is_admin() or public.is_enrolled(course_id));
create policy themes_write on public.themes
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.videos enable row level security;
create policy videos_select on public.videos
  for select using (public.is_admin() or public.is_enrolled_theme(theme_id));
create policy videos_write on public.videos
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.enrollments enable row level security;
create policy enrollments_select on public.enrollments
  for select using (public.is_admin() or member_id = public.current_member_id());
create policy enrollments_write on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.progress enable row level security;
create policy progress_select on public.progress
  for select using (public.is_admin() or member_id = public.current_member_id());
create policy progress_insert on public.progress
  for insert with check (member_id = public.current_member_id());
create policy progress_delete on public.progress
  for delete using (public.is_admin() or member_id = public.current_member_id());

-- ---------- サムネイル画像の置き場 ----------

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy thumbnails_read on storage.objects
  for select using (bucket_id = 'thumbnails');
create policy thumbnails_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'thumbnails' and public.is_admin());
create policy thumbnails_update on storage.objects
  for update to authenticated using (bucket_id = 'thumbnails' and public.is_admin());
create policy thumbnails_delete on storage.objects
  for delete to authenticated using (bucket_id = 'thumbnails' and public.is_admin());

-- ---------- 運営者アカウント ----------
-- ★ ここをあなたのメールアドレスに書き換えてから実行してください!
--   実行後、サイトの「初回パスワード登録」からこのメールアドレスで
--   パスワードを設定すると、管理画面に入れます。

insert into public.members (name, email, is_admin)
values ('運営者', 'your-email@example.com', true);
