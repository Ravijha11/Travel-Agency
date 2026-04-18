# Lahar ↔ Gwalior Rides — Overview

## What this website is
**Lahar ↔ Gwalior Rides** is a coordination-only ride sharing directory:

- **Drivers** post upcoming trips (route, time, seats, price per seat).
- **Riders** browse trips and contact drivers directly (phone call).
- **The platform does not** take payments, confirm bookings, or guarantee seats. Riders and drivers coordinate outside the app.

## Roles
- **Rider (public)**: can browse trips and see driver contact for active upcoming trips.
- **Driver (authenticated)**: can post and manage their own trips and profile.
- **Admin (authenticated)**: can verify/restrict drivers and view aggregate “call click” demand.

## Key user journeys
### Rider
1. Open Home feed.
2. Choose direction (Lahar → Gwalior or Gwalior → Lahar).
3. Pick a trip and tap **Call now** to coordinate seats/fare directly with the driver.

### Driver
1. Sign in.
2. Open **Driver dashboard**.
3. Post a trip.
4. Update trip status (mark full/completed) when needed.

### Admin
1. Sign in with an admin account.
2. Open **Admin panel**.
3. Verify drivers (blue tick) or restrict (ban) if needed.

## Scope freeze (current)
This project is currently scoped as **coordination-only**:

- No in-app seat booking / reservation
- No in-app chat
- No in-app payments
- No refunds/settlements

If you later want booking/payments, we’ll need schema + RLS changes and new flows.

