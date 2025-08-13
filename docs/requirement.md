Phase 6 — Quality, Tooling, and Delivery
 Type safety & state management
 Define Column, Card types
 Utilities for stable reindexing after moves
 Testing
 Unit tests for position/reindex utilities
 Integration test for add/move across columns logic
 Performance
 Avoid excessive network calls (batch updates on drop)
 Indexes: (position) and FKs for faster queries
 DevEx
 Prettier + ESLint (TypeScript/React rules)
 Simple CI lint/test
 Deploy
 Environment variables on host (e.g., Netlify/Vercel)
 Smoke test against production DB
 Definition of Done (Phase 6)
 Tests pass; deployment live with correct env and basic monitoring/logging.
