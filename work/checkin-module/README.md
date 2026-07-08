# Public Event Check-in Module

Prepared for the existing Member CRM app. This is not a separate app.

## Files

- `pages/EventCheckIn.jsx`
  - Public mobile-first route: `/checkin/:eventId`
  - Lets attendees enter email or Chinese name.
  - Defaults to Traditional Chinese and supports English toggle.
  - Calls `public-event-checkin` backend function.

- `pages/CheckInSuccess.jsx`
  - Public success route: `/checkin-success/:eventId`
  - Shows check-in success, event name, attendee name, total attendance count, social buttons, and lucky draw placeholder.
  - Defaults to Traditional Chinese and supports English toggle.

- `functions/public-event-checkin/index.ts`
  - Searches `EventRegistrations` by `event_id`.
  - Exact email match first.
  - Chinese name fallback.
  - Duplicate Chinese names return a staff-confirmation list with masked data.
  - Prevents duplicate check-ins.
  - Creates missing `Member`.
  - Updates `Member.total_checkins`, `last_event_attended`, `last_checkin_date`, and `event_tags`.
  - Creates `CheckInRecords`.

- `functions/get-checkin-success/index.ts`
  - Minimal fallback loader for success page event name.

- `snippets/routes.jsx`
  - Public route snippet to add to the existing router.

## Required Base44 entities

Existing:

- `Member`

Required new/shared:

- `Events`
- `EventRegistrations`
- `CheckInRecords`

## Security notes

- The public page does not query `Member` or `EventRegistrations` directly.
- Sensitive lookup and updates happen in backend functions with service-role access.
- Duplicate Chinese-name matches expose only masked name/email.
- No contact/member data download is included.
