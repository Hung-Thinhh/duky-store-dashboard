# Blog Block Implementation Tasks

Last updated: 2026-05-19

## Phase 1 - Core block editor in dashboard

- [x] T1. Add implementation tracker and status file.
- [x] T2. Add block data model (`post_title`, `rich_text`, `contact_footer`) for admin shortcuts and reusable library metadata.
- [x] T3. Add compile/minify helper path for DB storage and HTML beautify helper for admin readability.
- [x] T4. Add block manager UI (quick insert blocks in editor + reusable insert/delete).
- [x] T5. Add `post_title` block quick action (auto pulls current post title at insert time).
- [x] T6. Add `rich_text` block quick action.
- [x] T7. Add `contact_footer` block quick action.
- [x] T8. Save pipeline: minify HTML before submit to API.

## Phase 2 - Reusable blocks

- [x] T9. Create reusable block library storage (local persistence in admin).
- [x] T10. Save current content as reusable and insert reusable into post.
- [ ] T11. Add reusable block management UI (rename, delete, insert).

## Phase 3 - Blog templates

- [x] T12. Add built-in templates (review, promo, guide).
- [x] T13. Add apply-template flow when creating/editing post.
- [ ] T14. Add template preview and overwrite confirmation.

## Verification

- [x] V1. `npm run typecheck` passes.
- [x] V2. `npm run build` passes.
- [ ] V3. Manual check: create post with mixed blocks, save, reload, no data loss.
