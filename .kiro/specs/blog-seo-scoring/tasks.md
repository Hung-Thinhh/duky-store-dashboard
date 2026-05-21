# Implementation Plan: Blog SEO Scoring

## Overview

Implement a real-time SEO scoring system for the blog editor, similar to Rank Math SEO / Yoast SEO. The system analyzes blog content based on a focus keyword and scores it against standard SEO criteria. All analysis runs client-side with debounced updates. Implementation follows a bottom-up approach: types → pure logic modules → custom hook → UI components → integration.

## Tasks

- [x] 1. Set up SEO module structure and types
  - [x] 1.1 Create types module at `lib/seo/types.ts`
    - Define `SeoCheckResult`, `SeoAnalysisInput`, `SeoAnalysisResult`, `ParsedContent`, and `ScoreColor` interfaces/types
    - Export all types for use across the SEO module
    - _Requirements: 2.1, 2.2, 2.4, 8.4_

- [x] 2. Implement HTML parser
  - [x] 2.1 Create HTML parser module at `lib/seo/html-parser.ts`
    - Implement `parseHtmlContent(html, siteUrl)` using DOMParser to extract text, words, headings, images, links, paragraphs, and hasMedia
    - Implement `isExternalLink(href, siteUrl)` to classify links as internal or external based on hostname comparison
    - _Requirements: 8.4, 4.5, 4.6_

  - [ ]* 2.2 Write property test for HTML parser (Property 10)
    - **Property 10: HTML content parsing extracts correct elements**
    - **Validates: Requirements 8.4**
    - Create `lib/seo/__tests__/html-parser.property.test.ts`
    - Verify parseHtmlContent extracts all headings, image alts, and link hrefs without loss or duplication

  - [ ]* 2.3 Write property test for link classification (Property 7)
    - **Property 7: Link classification (external vs internal)**
    - **Validates: Requirements 4.5, 4.6**
    - Verify isExternalLink returns true iff resolved hostname differs from siteUrl hostname; relative URLs are always internal

- [x] 3. Implement SEO checks module
  - [x] 3.1 Create SEO checks module at `lib/seo/seo-checks.ts`
    - Implement `containsKeyword(text, keyword)` — case-insensitive whole phrase match
    - Implement `countKeywordOccurrences(text, keyword)` — non-overlapping count
    - Implement `calculateKeywordDensity(text, keyword)` — (occurrences / totalWords) × 100
    - Implement `keywordInIntro(words, keyword)` — check first 10% of words
    - Implement `keywordAtBeginningOfTitle(title, keyword)` — check first 50% of title
    - Implement `runAllChecks(input, parsed)` — run all 16 SEO checks and return results with weights
    - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 6.1, 6.2, 9.1, 9.2_

  - [ ]* 3.2 Write property test for keyword presence detection (Property 3)
    - **Property 3: Keyword presence detection (case-insensitive, whole phrase)**
    - **Validates: Requirements 1.4, 3.1, 3.2, 3.3, 3.5**
    - Create `lib/seo/__tests__/seo-checks.property.test.ts`
    - Verify containsKeyword returns true iff T.toLowerCase() contains K.toLowerCase().trim()

  - [ ]* 3.3 Write property test for keyword in intro (Property 4)
    - **Property 4: Keyword in content intro (first 10%)**
    - **Validates: Requirements 3.4**
    - Verify keywordInIntro returns true iff keyword appears in first ceil(W.length × 0.1) words

  - [ ]* 3.4 Write property test for keyword density formula (Property 5)
    - **Property 5: Keyword density formula correctness**
    - **Validates: Requirements 9.1, 9.2, 9.5**
    - Verify calculateKeywordDensity equals (countKeywordOccurrences / wordCount) × 100

  - [ ]* 3.5 Write property test for keyword density threshold (Property 6)
    - **Property 6: Keyword density threshold**
    - **Validates: Requirements 4.3, 9.3, 9.4**
    - Verify density check passes iff 1.0 ≤ density ≤ 2.5

  - [ ]* 3.6 Write property test for keyword position in title (Property 8)
    - **Property 8: Keyword position in title (first 50%)**
    - **Validates: Requirements 5.1**
    - Verify keywordAtBeginningOfTitle returns true iff containsKeyword(T.substring(0, ceil(T.length/2)), K)

  - [ ]* 3.7 Write property test for paragraph length check (Property 9)
    - **Property 9: Paragraph length check**
    - **Validates: Requirements 6.1**
    - Verify paragraph length check passes iff every paragraph has word count ≤ 150

  - [ ]* 3.8 Write property test for keyword occurrence counting (Property 11)
    - **Property 11: Keyword occurrence counting (non-overlapping)**
    - **Validates: Requirements 9.2**
    - Verify countKeywordOccurrences returns exactly N when keyword is inserted N times non-overlapping

- [x] 4. Implement SEO scorer module
  - [x] 4.1 Create SEO scorer module at `lib/seo/seo-scorer.ts`
    - Implement `calculateScore(checks)` — weighted sum normalized to 0-100
    - Implement `getScoreColor(score)` — red ≤50, orange 51-80, green ≥81
    - Implement `analyzeSeo(input)` — orchestrate parsing, checks, and scoring
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 4.2 Write property test for score calculation invariant (Property 1)
    - **Property 1: Score calculation invariant**
    - **Validates: Requirements 2.1, 2.4**
    - Create `lib/seo/__tests__/seo-scorer.property.test.ts`
    - Verify calculateScore returns value in [0, 100] equal to Math.round((earned/total) × 100)

  - [ ]* 4.3 Write property test for score color mapping (Property 2)
    - **Property 2: Score color mapping determinism**
    - **Validates: Requirements 2.2**
    - Verify getScoreColor returns 'red' if ≤50, 'orange' if 51-80, 'green' if ≥81

- [x] 5. Checkpoint - Ensure all logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement custom hook
  - [x] 6.1 Create `useSeoAnalysis` hook at `hooks/use-seo-analysis.ts`
    - Accept `SeoAnalysisInput | null` and return `SeoAnalysisResult | null`
    - Implement 300ms debounce using setTimeout in useEffect
    - Return null when input is null or focusKeyword is empty/whitespace
    - Re-run analysis when any input field changes
    - _Requirements: 1.2, 1.3, 2.3, 8.1, 8.2, 8.3_

- [x] 7. Implement SEO UI components
  - [x] 7.1 Create `SeoCheckItem` component at `components/seo/seo-check-item.tsx`
    - Display a single check with green ✓ icon when passed and red ✗ icon when failed
    - Show the check label text
    - _Requirements: 7.4_

  - [x] 7.2 Create `SeoCheckSection` component at `components/seo/seo-check-section.tsx`
    - Collapsible section with title and error count badge
    - Render list of `SeoCheckItem` components
    - Support `defaultOpen` prop
    - _Requirements: 7.2, 7.3, 7.5_

  - [x] 7.3 Create `SeoScoreIndicator` component at `components/seo/seo-score-indicator.tsx`
    - Display score as number /100 with color-coded background
    - Red (`text-red-600 bg-red-50`) for 0-50, orange for 51-80, green for 81-100
    - _Requirements: 2.2_

  - [x] 7.4 Create `SeoScoringPanel` component at `components/seo/seo-scoring-panel.tsx`
    - Include focus keyword input field
    - Display `SeoScoreIndicator` when result is available
    - Render 4 `SeoCheckSection` components: Basic SEO, Additional, Title Readability, Content Readability
    - Filter checks by section for each group
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Integrate SEO panel into blog editor
  - [x] 8.1 Wire `useSeoAnalysis` hook and `SeoScoringPanel` into blog editor page
    - Add focusKeyword state initialized from `post?.seo?.focusKeyword`
    - Derive `SeoAnalysisInput` from form state (title, slug, metaDescription, editor HTML)
    - Pass analysis result to `SeoScoringPanel`
    - Integrate panel into existing "Rank Math SEO" section
    - _Requirements: 1.1, 1.2, 1.3, 2.3, 7.1, 8.1, 8.2, 8.3, 8.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Write unit tests for SEO modules
  - [ ]* 10.1 Write unit tests for seo-checks at `lib/seo/__tests__/seo-checks.test.ts`
    - Test containsKeyword with Vietnamese diacritics, multi-word phrases
    - Test countKeywordOccurrences with overlapping patterns
    - Test keywordInIntro with short content (< 10 words)
    - Test calculateKeywordDensity edge cases (1 word content, keyword = entire content)
    - _Requirements: 1.4, 3.1, 3.4, 9.1, 9.2_

  - [ ]* 10.2 Write unit tests for seo-scorer at `lib/seo/__tests__/seo-scorer.test.ts`
    - Test analyzeSeo with full blog post sample → verify reasonable score
    - Test analyzeSeo with empty blog post → verify score = 0
    - Test calculateScore with all pass → score = 100
    - Test calculateScore with all fail → score = 0
    - _Requirements: 2.1, 2.4_

  - [ ]* 10.3 Write unit tests for html-parser at `lib/seo/__tests__/html-parser.test.ts`
    - Test parse HTML with figure/figcaption (TipTap image format)
    - Test parse HTML with table content
    - Test parse HTML with blockquote
    - Test isExternalLink with relative URLs, absolute URLs, protocol-relative URLs
    - _Requirements: 8.4, 4.5, 4.6_

  - [ ]* 10.4 Write integration test for SeoScoringPanel at `components/__tests__/seo-scoring-panel.test.tsx`
    - Test render with empty keyword → no score displayed
    - Test render with keyword + content → score and checks displayed
    - Verify 4 sections render with correct titles
    - Verify collapsible behavior
    - Verify error count badges
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All logic is pure functions (no side effects) making testing straightforward
- The project already has `vitest` and `fast-check` configured in devDependencies
- HTML parsing uses browser-native DOMParser — no additional dependencies needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["6.1", "7.1", "7.2", "7.3"] },
    { "id": 5, "tasks": ["7.4"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
