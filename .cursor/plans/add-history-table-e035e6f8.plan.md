<!-- e035e6f8-b69a-4c9e-996e-cd420fd1f471 8c0bf7bf-8909-4869-8b26-105dad854831 -->
# Fix TypeRacer Issues

## Issue 1: OpenAI API Error

**Problem**: `maxOutputTokens: 5` is below OpenAI's minimum of 16
**Fix**: Change line 67 in `app/api/typeracer/race/route.ts` from `maxOutputTokens: 5` to `maxOutputTokens: 16`

## Issue 2: Submit Not Being Called

**Problem**: No `[typeracer/submit]` logs appear, meaning the submit endpoint is never called

**Debug Steps**:

1. Add console.log at the start of `submitResult` function to see if it's even triggered
2. Add console.log to check the conditions: `handle.trim()`, `finishTime`, `savedToLb`
3. Add console.log when the submit form should be displayed
4. Verify the condition `!savedToLb` is correct (should show form when not yet saved)

This will help identify if:

- The function is being called but failing silently
- The conditions are preventing submission
- The form isn't showing up at all

### To-dos

- [ ] Create migration file for history table
- [ ] Add insertHistoryEntry and getHistory functions
- [ ] Update all 3 submit endpoints to insert history
- [ ] Update HomePage and HomeContent to show history