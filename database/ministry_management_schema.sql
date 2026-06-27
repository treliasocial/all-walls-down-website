-- All Walls Down Organization ministry management schema.
-- Intended for Postgres/Supabase style deployments. Keep SMTP secrets in a
-- server-side vault or encrypted secrets table, not in frontend JavaScript.

create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'Ministry Staff',
  roles text[] not null default array['Ministry Staff'],
  show_on_leadership boolean not null default false,
  mfa_required boolean not null default true,
  mfa_enabled boolean not null default false,
  mfa_methods jsonb not null default '{}'::jsonb,
  mfa_enrollment_status text not null default 'Required'
    check (mfa_enrollment_status in ('Required', 'Enrolled', 'Not Required', 'Administrator Exempt')),
  last_mfa_updated_at timestamptz,
  require_password_reset boolean not null default true,
  is_active boolean not null default true,
  created_by_staff_user_id uuid references staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_permission_audit (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references staff_users(id) on delete cascade,
  changed_by_staff_user_id uuid references staff_users(id) on delete set null,
  previous_role text,
  next_role text not null,
  created_at timestamptz not null default now()
);

create table if not exists mfa_policy (
  id uuid primary key default gen_random_uuid(),
  require_mfa_for_staff boolean not null default true,
  exempt_administrators boolean not null default true,
  force_first_login_enrollment boolean not null default true,
  allowed_methods jsonb not null default '{
    "authenticator": true,
    "googleAuthenticator": true,
    "biometric": true,
    "passwordManager": true
  }'::jsonb,
  updated_by_staff_user_id uuid references staff_users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  request text not null,
  is_confidential boolean not null default false,
  status text not null default 'Pending Prayer'
    check (status in ('Pending Prayer', 'We have Prayed')),
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  prayed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  city text,
  ministry text not null default 'All Walls Down',
  quote text not null,
  status text not null default 'Pending Review'
    check (status in ('Pending Review', 'Approved', 'Needs Follow Up', 'Declined')),
  display_on_site boolean not null default false,
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint approved_display_only check (display_on_site = false or status = 'Approved')
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  category text not null default 'General Contact',
  reason text not null default 'General Contact',
  message text not null,
  status text not null default 'New'
    check (status in ('New', 'In Conversation', 'Followed Up', 'Closed')),
  tags text[] not null default '{}',
  priority text not null default 'Normal'
    check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  assigned_to text,
  next_follow_up date,
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  staff_user_id uuid references staff_users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists contact_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists email_settings (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null default 'Google Workspace',
  smtp_host text not null,
  smtp_port integer not null,
  pop3_host text,
  pop3_port integer,
  username text,
  from_name text not null,
  from_email text not null,
  use_tls boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  staff_user_id uuid references staff_users(id) on delete set null,
  subject text not null,
  message text not null,
  from_email text not null,
  to_email text not null,
  status text not null default 'Prepared'
    check (status in ('Prepared', 'Queued', 'Sent', 'Failed')),
  prepared_at timestamptz not null default now(),
  sent_at timestamptz,
  error_message text
);

create index if not exists prayer_requests_status_idx on prayer_requests(status);
create index if not exists prayer_requests_submitted_at_idx on prayer_requests(submitted_at desc);
create index if not exists testimonials_public_idx on testimonials(status, display_on_site);
create index if not exists testimonials_submitted_at_idx on testimonials(submitted_at desc);
create index if not exists contacts_status_idx on contacts(status);
create index if not exists contacts_category_idx on contacts(category);
create index if not exists contacts_next_follow_up_idx on contacts(next_follow_up);
create index if not exists contacts_submitted_at_idx on contacts(submitted_at desc);
create index if not exists email_messages_contact_idx on email_messages(contact_id, prepared_at desc);
create index if not exists staff_users_role_idx on staff_users(role);
create index if not exists staff_users_roles_idx on staff_users using gin(roles);
create index if not exists staff_users_leadership_idx on staff_users(show_on_leadership, is_active);
create index if not exists staff_users_mfa_required_idx on staff_users(mfa_required, mfa_enabled);
create index if not exists staff_permission_audit_user_idx on staff_permission_audit(staff_user_id, created_at desc);
