# Migrate ChitChat to Your Own Supabase

## Why a new project

Lovable Cloud cannot be removed from this project once it's been added — reverting to an older version doesn't undo it either. To fully own the backend (your Supabase URL, your auth settings, your billing), we need to move the code into a fresh Lovable project that connects to *your* Supabase from day one.

## What you do (outside this chat)

1. Create a Supabase project at supabase.com (pick a region close to your users, e.g. `ap-south-1` since ChitChat targets India).
2. In that Supabase project, grab:
  - Project URL
  - `anon` / publishable key
  - `service_role` key (only for edge functions, kept secret)
3. In Lovable, create a **new blank project**. In the new project, use the Supabase native integration (not Lovable Cloud) and paste the credentials above. Lovable will write `.env` for you against *your* project.
4. In your Supabase dashboard, under **Authentication → Providers**, enable:
  - Email (this is what fixes "Email logins are disabled")
  - Google (add OAuth client ID/secret from Google Cloud Console)
5. Under **Authentication → URL Configuration**, add your site URL and redirect URLs:
  - `https://www.chitchatgen.com`
  - `https://chitchatgen.lovable.app`
  - `http://localhost:8080`

## What I do (in the new project, once you open a chat there)

1. **Port the code** — copy over from this project:
  - All UI/pages/components (`src/pages`, `src/components`, `src/hooks`, `src/lib`, `src/assets`)
  - Capacitor config for `com.chitchat.ai`
  - `public/` (including `AETHER_COMPLETE_SOURCE_CODE.js`)
  - `vercel.json` (SPA rewrite + `/signin` → `/auth` redirect)
  - `tailwind.config.ts`, `index.css`, theme tokens
2. **Recreate the database schema** on your Supabase via a single migration:
  - `profiles` (id, display_name, avatar, onboarding fields, timestamps)
  - `conversations` (user_id, title, timestamps)
  - `messages` (conversation_id, role, content, timestamps)
  - `user_roles` + `app_role` enum + `has_role()` security-definer function
  - `handle_new_user()` trigger on `auth.users` to seed `profiles`
  - RLS policies + GRANTs on every table
3. **Port edge functions** (Gemini chat, ElevenLabs TTS, etc.) and set their secrets in *your* Supabase:
  - `GEMINI_API_KEY` (or keep using Lovable AI Gateway — up to you)
  - `ELEVENLABS_API_KEY`
  - Any others currently in use
4. **Wire auth** — email OTP + Google OAuth using your redirect URLs, keep the existing `/auth` page, keep `/signin → /auth` redirect.
5. **Verify** — run the app locally, sign in with email OTP, sign in with Google, send a chat message, play TTS. Screenshot each step.
6. **Deploy** — publish the new project, then repoint your `www.chitchatgen.com` DNS at the new Lovable URL (or Vercel, if you keep Vercel).

## What stays behind

This current project (`bf35d7ff-...`) keeps running on Lovable Cloud until you're happy with the new one. Nothing here gets deleted by the migration. Once cutover is done and DNS points to the new project, you can archive this one.

## Decisions I still need from you

- **AI provider in the new project:** keep Lovable AI Gateway (no key needed), or switch to your own Google Gemini API key?
- **Hosting:** publish through Lovable (`*.lovable.app` + custom domain), or keep Vercel deployment?
- **When you're ready:** open a chat in the newly created blank Lovable project and tell me "start the port" — I'll then use the cross-project tools to copy files across and write the migration on your Supabase.

## Technical notes

- I cannot create the new Lovable project or the Supabase project for you — both require your account actions.
- Cross-project file copy works one direction: from this project into the new one, which is what we need.
- The Supabase `service_role` key must only be set as an edge-function secret in your Supabase — never committed and never referenced from frontend code.
- `.env` in the new project will hold `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` for *your* project; Lovable manages those values via the Supabase native integration.                
- so the supabase url = eicaivnsusivtypalqrd,publisher key =sb_publishable_NhxOOB6bFumEs-R96WqLuw_GDfbyEMa, seceret key=sb_secret_3b3l9Sqw3IaHP3ZftXKtjQ_1kl3OBJ0