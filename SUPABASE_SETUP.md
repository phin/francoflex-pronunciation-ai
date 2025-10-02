# Supabase Database Setup

## Quick Start

1. Go to your Supabase project: https://pznzykwfboqryuibelqs.supabase.co
2. Navigate to the **SQL Editor**
3. Copy and paste the entire contents of `supabase_schema.sql`
4. Click **Run** to create all tables

## Tables Created

### 1. `preferences`
Stores user learning preferences (language, industry, job, etc.)

**Fields:**
- `id` - UUID (primary key)
- `user` - UUID (unique user identifier)
- `learning` - Learning language
- `native` - Native language
- `industry` - User's industry
- `job` - User's job title
- `name` - User's name
- `created_at`, `updated_at` - Timestamps

### 2. `sessions`
Stores learning sessions with questions and content

**Fields:**
- `id` - UUID (primary key)
- `user` - UUID (user identifier)
- `level` - Language level (A1-C2)
- `type` - Session type ('repeat' or 'conversational')
- `content` - JSONB (questions and answers)
- `created_at`, `updated_at` - Timestamps

### 3. `messages`
Stores conversation messages between user and system

**Fields:**
- `id` - UUID (primary key)
- `author` - 'system' or 'user'
- `session` - UUID (references sessions)
- `content` - Message text
- `metadata` - JSONB (audio URLs, etc.)
- `created_at` - Timestamp

### 4. `pronunciation_analysis`
Stores pronunciation analysis results

**Fields:**
- `id` - UUID (primary key)
- `user` - UUID (user identifier)
- `type` - Analysis type
- `level` - Language level
- `content` - JSONB (analysis data)
- `created_at` - Timestamp

## Row Level Security (RLS)

The schema includes RLS policies that ensure:
- Users can only access their own data
- Data is automatically filtered by authenticated user
- Messages are accessible only through user's sessions

## Testing Your Setup

After running the schema, test with:

```sql
-- Insert test preference
INSERT INTO preferences (user, learning, native, industry, job, name)
VALUES (
  'test-user-uuid',
  'French',
  'English',
  'Technology',
  'Developer',
  'Test User'
);

-- View all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

## Authentication Setup

If you want to use Supabase Auth:

1. Go to **Authentication** > **Settings**
2. Configure providers (Email, Google, etc.)
3. Update your frontend to use Supabase auth
4. Replace UUID generation with `auth.uid()`

## Storage Setup (for Audio Files)

If you're using audio uploads:

1. Go to **Storage** > **Create bucket**
2. Name: `audio-recordings`
3. Make it public (or use signed URLs)
4. Update CORS settings if needed

## Troubleshooting

### Tables already exist?
If tables already exist, you can:
- Drop them: `DROP TABLE table_name CASCADE;`
- Or modify the schema to use `CREATE TABLE IF NOT EXISTS`

### RLS blocking access?
For development, you can temporarily disable RLS:
```sql
ALTER TABLE preferences DISABLE ROW LEVEL SECURITY;
```

### Need to reset?
```sql
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS pronunciation_analysis CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS preferences CASCADE;
```

Then re-run the schema.

## Next Steps

1. ✅ Run `supabase_schema.sql` in SQL Editor
2. Test with sample data
3. Set up authentication (optional)
4. Configure storage buckets for audio
5. Deploy your Netlify app!
