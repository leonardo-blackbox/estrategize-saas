# Migration 002 Verification Guide

## Status
✅ **Migration Applied Manually** (User applied via Supabase SQL Editor)

## What Changed
The migration `002_align_consultancies_prd.sql` makes these changes to the `consultancies` table:

1. ✏️ **Column Renames:**
   - `name` → `title`
   - `description` → `client_name`

2. 🗑️ **Column Dropped:**
   - `sector` (removed)

3. 🔒 **Status Constraint Updated:**
   - Old values: `draft`, `in_progress`, `completed`
   - New values: `active`, `archived` only
   - Auto-migrated old values → `active`

4. 🛡️ **RLS Policies Recreated:**
   - SELECT policy: Users see only their own records
   - INSERT policy: Users can only create records with their own user_id
   - UPDATE policy: Users can only update their own records
   - DELETE policy: Intentionally **omitted** (hard deletes blocked)

## Verification Steps

### Option 1: Manual SQL Verification (Easiest)

Run these queries in **Supabase SQL Editor** to verify the schema:

#### 1️⃣ Check Column Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'consultancies'
ORDER BY ordinal_position;
```

**Expected columns:**
- ✅ `id` (uuid, not null)
- ✅ `user_id` (uuid, not null)
- ✅ `title` (varchar, not null)
- ✅ `client_name` (varchar, nullable)
- ✅ `status` (varchar, not null)
- ✅ `deleted_at` (timestamp, nullable)
- ✅ `created_at` (timestamp, not null)
- ✅ `updated_at` (timestamp, not null)

**Not present:**
- ❌ `name`
- ❌ `description`
- ❌ `sector`

#### 2️⃣ Check Status Constraint
```sql
SELECT constraint_name, constraint_type, check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'consultancies'
  AND constraint_type = 'CHECK';
```

**Expected:**
- ✅ `consultancies_status_check` exists
- ✅ Allows only `'active'` and `'archived'`

#### 3️⃣ Check RLS Enabled
```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'consultancies';
```

**Expected:**
- ✅ `relrowsecurity` = true
- ✅ `relforcerowsecurity` = false (not forced, users can see with RLS policies)

#### 4️⃣ Check RLS Policies
```sql
SELECT policy_name, cmd, using_qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'consultancies'
ORDER BY policy_name;
```

**Expected policies:**
- ✅ `consultancies_insert_own` (INSERT)
- ✅ `consultancies_select_own` (SELECT)
- ✅ `consultancies_update_own` (UPDATE)
- ❌ NO DELETE policy (intentional - soft deletes only)

#### 5️⃣ Check Status Default
```sql
SELECT column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'consultancies'
  AND column_name = 'status';
```

**Expected:**
- ✅ Default is `'active'` (or `'active'::character varying`)

#### 6️⃣ Quick Data Check (Optional)
```sql
SELECT id, user_id, title, client_name, status
FROM public.consultancies
LIMIT 5;
```

**Expected:**
- ✅ Returns your test data (if you created any)
- ✅ `title` and `client_name` columns have values
- ✅ `status` is either `'active'` or `'archived'`

---

### Option 2: Using Supabase CLI (Advanced)

If you want to verify via CLI:

1. **Link your project:**
   ```bash
   supabase link --project-ref zihtyuwqfrkzzcmhstbd
   ```
   (You'll be prompted to paste your access token from supabase.com/account/tokens)

2. **Run verification queries:**
   ```bash
   supabase db pull  # Downloads current schema
   ```

3. **Check migration history:**
   ```bash
   supabase migration list
   ```

---

## Verification Results Template

Use this template to confirm all checks passed:

```
✅ Column Renames (name → title, description → client_name): PASS/FAIL
✅ Sector Column Removed: PASS/FAIL
✅ Status Constraint (active|archived): PASS/FAIL
✅ Status Default ('active'): PASS/FAIL
✅ RLS Enabled: PASS/FAIL
✅ SELECT Policy (consultancies_select_own): PASS/FAIL
✅ INSERT Policy (consultancies_insert_own): PASS/FAIL
✅ UPDATE Policy (consultancies_update_own): PASS/FAIL
✅ DELETE Policy (absent): PASS/FAIL
✅ Data Integrity (old status values migrated): PASS/FAIL

Overall: PASS/FAIL
```

---

## Next Steps

Once **all checks PASS**:

1. ✅ Mark migration as verified (complete this guide)
2. 🚀 Proceed to **Story 1.8: Consultancy Diagnosis (IA Iris)**

---

## Troubleshooting

### Issue: Columns still named `name` / `description`
- Migration was not applied
- **Solution:** Apply the SQL from `backend/src/database/migrations/002_align_consultancies_prd.sql` in Supabase SQL Editor

### Issue: `sector` column still exists
- Migration did not run completely
- **Solution:** Run Step 2 from the migration SQL

### Issue: Status constraint allows old values (`draft`, `completed`, etc.)
- Old constraint not dropped
- **Solution:** Run Steps 3-4 from the migration SQL

### Issue: DELETE policy exists
- Additional policy created
- **Solution:** Drop it with `DROP POLICY "consultancies_delete_own" ON public.consultancies;`

---

**File Location:** `backend/verify-migration-002.sql`
**Migration File:** `backend/src/database/migrations/002_align_consultancies_prd.sql`
**Last Updated:** 2026-02-19
