# Data Isolation Fix - Complete Analysis

## Root Cause Identified

The `LoginScreen.tsx` was NOT storing `branch_id` and `employee_id` from the API response.

**Before (Broken):**

```tsx
login({
  id: data.data.user.employee_id,
  name: data.data.user.full_name,
  email: data.data.user.email,
  role: data.data.user.role_name,
  token: data.data.token,
  photo: data.data.user.photo_path,
  // branch_id and employee_id were MISSING!
});
```

**After (Fixed):**

```tsx
login({
  id: data.data.user.employee_id,
  name: data.data.user.full_name,
  email: data.data.user.email,
  role: data.data.user.role_name,
  token: data.data.token,
  photo: data.data.user.photo_path,
  branch_id: data.data.user.branch_id, // Added
  employee_id: data.data.user.employee_id, // Added
});
```

## Impact

Because `branch_id` was never stored, all screens that did `user?.branch_id || 1` would ALWAYS use `1` as the branch, causing:

- Branch 6 users seeing Branch 1 data
- No data isolation whatsoever

## Files Modified

### Frontend

1. `LoginScreen.tsx` - Now stores branch_id and employee_id
2. `PatientsScreen.tsx` - Added auth store import and sends branch_id/employee_id
3. `AppointmentsScreen.tsx` - Fixed hardcoded branch_id

### Backend (app/server/api/)

All API files now have:

1. `session_start()` for session support
2. Fallback to accept `branch_id` from request params
3. Strict 401 response if no valid branch can be determined

## Required Action

**User must LOG OUT and LOG BACK IN** for the fix to take effect. The old session in localStorage doesn't have branch_id stored, so logging in again will populate it correctly.

## Verification

After re-login, check browser DevTools > Application > Local Storage > `auth-storage`.
It should show:

```json
{
  "user": {
    "branch_id": 6,
    "employee_id": 123,
    ...
  }
}
```
