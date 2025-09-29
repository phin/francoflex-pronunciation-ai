# Supabase Authentication Setup

This guide will help you set up Supabase authentication for the Francoflex pronunciation app.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `francoflex-pronunciation`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Configure the following:

### Site URL
- Set to `http://localhost:3000` for development
- Set to your production domain for production

### Redirect URLs
Add these URLs (one per line):
```
http://localhost:3000
http://localhost:3000/voice_chat_activity
https://your-production-domain.com
https://your-production-domain.com/voice_chat_activity
```

### Email Templates (Optional)
You can customize the email templates for:
- Confirm signup
- Reset password
- Magic link

## 5. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings** > **Auth Providers**
2. Make sure **Email** is enabled
3. Configure email settings if needed

## 6. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Try creating a new account
4. Check your email for the confirmation link
5. Try logging in with your credentials

## Features Included

✅ **User Registration**: Email and password signup with confirmation
✅ **User Login**: Email and password authentication
✅ **Password Validation**: Confirm password matching for registration
✅ **Session Management**: Automatic session handling with Supabase
✅ **Protected Routes**: Automatic redirect for authenticated users
✅ **Logout Functionality**: Clean logout with session cleanup
✅ **User Profile**: Display authenticated user info in sidebar
✅ **Loading States**: Proper loading indicators during auth operations
✅ **Error Handling**: Toast notifications for auth errors
✅ **Email Verification**: Supabase handles email confirmation

## Security Notes

- The `anon` key is safe to use in client-side code
- User passwords are securely hashed by Supabase
- Sessions are managed securely by Supabase
- All authentication happens through Supabase's secure infrastructure

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Check if the user exists and email is verified
   - Ensure correct email/password combination

2. **"Email not confirmed"**
   - Check spam folder for confirmation email
   - Resend confirmation email from Supabase dashboard

3. **Redirect loops**
   - Verify your redirect URLs are correctly configured
   - Check that your site URL matches your domain

4. **Environment variables not working**
   - Restart your development server after adding `.env.local`
   - Ensure both variables start with `NEXT_PUBLIC_` (required for browser access)

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
