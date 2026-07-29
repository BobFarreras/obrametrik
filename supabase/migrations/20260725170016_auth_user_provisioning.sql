/*
 * Purpose: provision the identity aggregate after a successful Auth signup.
 * Security: metadata is display-only; authorization always derives from auth.users.id.
 */
create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
  safe_name text;
  requested_locale text;
begin
  requested_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  safe_name := left(
    case
      when char_length(requested_name) >= 2 then requested_name
      when char_length(split_part(coalesce(new.email, ''), '@', 1)) >= 2
        then split_part(new.email, '@', 1)
      else 'Usuari'
    end,
    80
  );
  requested_locale := new.raw_user_meta_data ->> 'preferred_locale';

  insert into public.profiles (id, display_name, preferred_locale)
  values (
    new.id,
    safe_name,
    case
      when requested_locale in ('ca', 'es', 'en')
        then requested_locale::public.app_locale
      else 'ca'::public.app_locale
    end
  );

  insert into public.organizations (name, slug, created_by)
  values (
    safe_name,
    'personal-' || replace(new.id::text, '-', ''),
    new.id
  );

  return new;
end;
$$;

create trigger auth_user_provision_identity
after insert on auth.users
for each row execute function private.handle_new_auth_user();
