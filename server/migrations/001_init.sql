create table users (
  id               text primary key,
  login            text not null,
  name             text not null,
  role             text not null check (role in ('superadmin','manager')),
  password_hash    text not null,
  totp_secret_enc  text,
  totp_enabled     boolean not null default false,
  totp_last_step   bigint not null default 0,
  token_version    integer not null default 0,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  created_at       timestamptz not null default now()
);
create unique index users_login_lower_idx on users (lower(login));

create table backup_codes (
  id        bigserial primary key,
  user_id   text not null references users(id) on delete cascade,
  code_hash text not null,
  used_at   timestamptz
);
create index backup_codes_user_idx on backup_codes (user_id);

create table directions (
  id          text primary key,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table news (
  id               serial primary key,
  date             text not null,
  year             integer not null,
  show_in_history  boolean not null default false,
  data             jsonb not null
);
create index news_date_idx on news (date desc);

create table partners (
  id          text primary key,
  sort_order  integer not null default 0,
  data        jsonb not null
);

create table settings (
  id    integer primary key check (id = 1),
  data  jsonb not null
);

create table inquiries (
  id               text primary key,
  created_at       timestamptz not null default now(),
  name             text not null,
  phone            text not null,
  company          text not null default '',
  message          text not null default '',
  direction_id     text,
  direction_title  text not null default '',
  channel          text not null default 'site',
  page             text not null default '',
  status           text not null default 'new' check (status in ('new','in_progress','answered')),
  ip_hash          text
);
create index inquiries_created_idx on inquiries (created_at desc);
create index inquiries_status_idx on inquiries (status);

create table audit_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  user_id     text,
  user_login  text,
  action      text not null,
  entity      text,
  entity_id   text,
  ip          text,
  details     jsonb
);
create index audit_at_idx on audit_log (at desc);

create table tg_recipients (
  chat_id     bigint primary key,
  label       text not null default '',
  kind        text not null default 'private',
  status      text not null default 'pending' check (status in ('pending','approved')),
  created_at  timestamptz not null default now()
);

create table bot_state (
  key    text primary key,
  value  text not null
);