# Date Logic Fix - 2:00 AM Czech Time Reset

## Problem
The application was inconsistently applying the 2:00 AM Czech time reset for day boundaries:
- Daily calculations correctly used the 2-hour offset
- Weekly and monthly calculations did NOT use the offset for date range boundaries
- This caused payments from the previous day/month to appear in the current period

## Solution
Applied the 2-hour offset consistently across ALL date filtering in the application:

### Files Modified
1. `/src/api/queries.js` - Main queries file
2. `/src/api/analytics.js` - Analytics queries file

### Specific Changes

#### 1. `getTeamTotals()` - Line 3-17
**Fixed:** Weekly and monthly calculations now use the 2-hour offset
```sql
-- BEFORE (weekly):
(paid_at AT TIME ZONE 'Europe/Prague')::date >= date_trunc('week', (now() AT TIME ZONE 'Europe/Prague')::date)

-- AFTER (weekly):
((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= date_trunc('week', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date)
```

#### 2. `listClients()` - Line 231-256
**Fixed:** The "Past 30 Days" and "Last Sent" date calculations now use the 2-hour offset
```sql
-- BEFORE:
max(p.paid_at::date) as last_sent
sum(case when p.paid_at >= (now() AT TIME ZONE 'Europe/Prague') - interval '29 days' ...

-- AFTER:
max(((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) as last_sent
sum(case when ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= (((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date - interval '29 days') ...
```

#### 3. `getLeagueData()` - Line 387-445
**Fixed:** Monthly points calculation now correctly uses the 2-hour offset for month boundaries
```sql
-- BEFORE:
date_trunc('month', ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) = date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date)

-- AFTER:
((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date)
and ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date < date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) + interval '1 month'
```

#### 4. `debugClientPaymentStats()` - Line 556-573
**Fixed:** The "last 30 days" calculation in debug function

#### 5. `debugPetrStats` - Line 178-195
**Fixed:** Debug query for testing client statistics

#### 6. `getDayOfWeekHeatmap()` in analytics.js - Line 179-193
**Fixed:** Day of week extraction now uses the 2-hour offset
```sql
-- BEFORE:
extract(dow from paid_at AT TIME ZONE 'Europe/Prague')

-- AFTER:
extract(dow from ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::timestamp)
```

## How It Works

### The 2-Hour Offset Logic
```
Example: It's 10/8/2025 at 1:30 AM Czech time

Without offset:
- Current date: 10/8/2025
- A payment at 10/7/2025 11:59 PM would be considered "yesterday"

With 2-hour offset:
- Effective date: 10/7/2025 (because 1:30 AM - 2 hours = 10/7/2025 11:30 PM)
- A payment at 10/7/2025 11:59 PM is also 10/7/2025 (11:59 PM - 2 hours = 10/7/2025 9:59 PM)
- Both are considered part of the same "day"

At 10/8/2025 2:00 AM Czech time:
- Effective date: 10/8/2025 (because 2:00 AM - 2 hours = 10/8/2025 12:00 AM)
- The new day has begun!
```

## Affected Pages
These pages will now correctly show data with the 2:00 AM reset:
- `/skore` - Daily, Weekly, Monthly totals
- `/tvuj-vykon` - League standings and statistics
- `/klienti-a-platby` - Client "Past 30 Days" and "Last Sent" dates
- `/analytics` - Day of week heatmap

## Testing
To verify the fix is working:
1. Check that payments made between 12:00 AM and 1:59 AM are counted as the PREVIOUS day
2. Check that payments made at or after 2:00 AM are counted as the CURRENT day
3. Verify that month boundaries work correctly (e.g., payments on 1st of month at 1:00 AM count as previous month)
4. Verify that week boundaries work correctly with the 2-hour offset

## Date: October 8, 2025

