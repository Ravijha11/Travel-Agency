# Admin operations

## Where admin controls live
- Admin UI: `[f:/LahartoGwalior/app/admin/page.tsx](f:/LahartoGwalior/app/admin/page.tsx)`
- Driver row controls: `[f:/LahartoGwalior/components/admin-driver-row.tsx](f:/LahartoGwalior/components/admin-driver-row.tsx)`
- Admin server actions: `[f:/LahartoGwalior/app/actions/admin.ts](f:/LahartoGwalior/app/actions/admin.ts)`

## Verify a driver (blue tick)
Use when:
- driver identity has been validated (your local process)

Effect:
- sets `profiles.is_verified = true`
- driver shows “Verified” badge in admin list and (optionally) public UI where used

## Restrict a driver (ban)
Use when:
- spam, fraud, harassment, repeated no-shows, or policy violation

Effect:
- sets `profiles.is_restricted = true`
- middleware redirects the driver away from `/dashboard` to `/suspended`

## Support playbook (minimum)
- **User can’t sign in**: confirm Supabase project is reachable and OAuth/email provider is configured.
- **Trips not visible**: check RLS policies and `departure_time > now()` rule.
- **Driver says profile details wrong**: driver can update allowed fields; privileged fields are protected by DB trigger.

## Admin metrics
Admin page displays total “Call now” clicks across trips (`trips.call_count`).
This is a demand signal you can share with drivers.

