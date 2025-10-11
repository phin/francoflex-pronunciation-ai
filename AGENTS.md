# AGENTS.md

Guidelines for any automation agent assisting with this project:

- Review `CLAUDE.md` for detailed project architecture, workflows, and migration plans before making changes.
- Follow the development commands in `CLAUDE.md` for both the Next.js frontend (`web-client`) and Netlify serverless functions.
- Note the dual-stack context (Netlify serverless as primary, FastAPI legacy) and the Firebase-first backend (Firestore + Realtime DB) described there.
- Pay attention to the outstanding TODOs in `CLAUDE.md`, including missing API functions, documentation, monitoring, and rate limiting.
