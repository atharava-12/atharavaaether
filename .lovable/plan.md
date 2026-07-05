## Plan

1. Confirm the current login failure
  - Treat the visible/backend error `Email logins are disabled` as an auth provider configuration issue, not a routing or `.env` issue.
  - Do not edit `.env`, per your instruction.
2. Enable email sign-in in the backend auth settings
  - Turn on the Email provider for this project.
  - Keep the app’s existing OTP-code login flow unchanged, since `/auth` already calls email OTP correctly.
3. Verify the app-side auth flow
  - Check that `/auth` still uses the correct email OTP request and verification methods.
  - Confirm `/signin` continues to redirect to `/auth` after the earlier routing fix.
4. Test the result
  - Submit an email on `/auth`.
  - Expected result: the app moves to the verification-code step instead of showing `Email logins are disabled`.

## Technical notes

- The failing request is `POST /auth/v1/otp` with `email_provider_disabled`.
- The `.env` values are not the cause because the request reaches the backend successfully and is rejected by auth configuration.
- No frontend code change should be needed unless the backend setting cannot be changed automatically.        