// scratch test to simulate SEO scoring for the blog post
// replicate the scoring logic from seo-scorer.ts

const CATEGORY_WEIGHTS = {
  basic: 10,
  additional: 5,
  titleReadability: 2.5,
  contentReadability: 1.25,
};

const SOFT_BONUS_CHECK_IDS = new Set([
  'secondary-keywords-in-content',
  'secondary-keywords-in-subheadings',
]);

const SOFT_BONUS_POINTS = 2;

// simulate the checks for the blog post
// Title: "Tem Giấy Hay Tem Nhựa Nên Chọn Loại Nào? So Sánh Chi Tiết Để Chọn Đúng Cho Sản Phẩm"
// Focus keyword: "tem giấy hay tem nhựa"
// Slug: something like "tem-giay-hay-tem-nhua-nen-chon-loai-nao"

const title = "Tem Giấy Hay Tem Nhựa Nên Chọn Loại Nào? So Sánh Chi Tiết Để Chọn Đúng Cho Sản Phẩm";
const keyword = "tem giấy hay tem nhựa";

function containsKeyword(text, kw) {
  if (!kw.trim()) return false;
  return text.normalize('NFC').toLowerCase().includes(kw.normalize('NFC').toLowerCase().trim());
}

function keywordAtBeginningOfTitle(t, kw) {
  if (!t.trim() || !kw.trim()) return false;
  const normalizedTitle = t.normalize('NFC').toLowerCase();
  const normalizedKeyword = kw.normalize('NFC').toLowerCase().trim();
  const index = normalizedTitle.indexOf(normalizedKeyword);
  if (index === -1) return false;
  return index <= Math.max(0, t.length / 2);
}

// Simulate all 20 checks (18 real + 2 soft bonus)
// Let's assume typical values for this blog post

const checks = [
  // Basic SEO (6 checks × 10 pts = 60 pts)
  { id: 'keyword-in-title', category: 'basic', passed: containsKeyword(title, keyword), label: 'KW in title' },
  { id: 'keyword-in-meta-description', category: 'basic', passed: true, label: 'KW in meta desc (AFTER fix)' }, // after our fix, auto-gen will include it
  { id: 'keyword-in-slug', category: 'basic', passed: true, label: 'KW in slug' },
  { id: 'keyword-in-intro', category: 'basic', passed: true, label: 'KW in intro (assuming yes)' },
  { id: 'keyword-in-content', category: 'basic', passed: true, label: 'KW in content' },
  { id: 'content-length', category: 'basic', passed: true, label: 'Content >= 600 words' },

  // Additional (8 checks × 5 pts = 40 pts, but 2 are soft bonus)
  { id: 'keyword-in-subheading', category: 'additional', passed: true, label: 'KW in H2/H3' },
  { id: 'keyword-in-image-alt', category: 'additional', passed: false, label: 'KW in image alt (might be missing)' },
  { id: 'keyword-density', category: 'additional', passed: true, label: 'KW density 1-2.5%' },
  { id: 'secondary-keywords-in-content', category: 'additional', passed: true, label: 'Secondary KW in content (SOFT BONUS)' },
  { id: 'secondary-keywords-in-subheadings', category: 'additional', passed: true, label: 'Secondary KW in H2/H3 (SOFT BONUS)' },
  { id: 'url-length', category: 'additional', passed: true, label: 'URL length <= 75' },
  { id: 'has-external-link', category: 'additional', passed: false, label: 'External link (might be missing)' },
  { id: 'has-internal-link', category: 'additional', passed: true, label: 'Internal link' },

  // Title Readability (2 checks × 2.5 pts = 5 pts)
  { id: 'keyword-at-beginning', category: 'titleReadability', passed: keywordAtBeginningOfTitle(title, keyword), label: 'KW at beginning of title (AFTER fix)' },
  { id: 'title-has-number', category: 'titleReadability', passed: false, label: 'Title has number (no number in title)' },

  // Content Readability (4 checks × 1.25 pts = 5 pts)
  { id: 'paragraph-length', category: 'contentReadability', passed: true, label: 'Paragraphs <= 150 words' },
  { id: 'has-media', category: 'contentReadability', passed: true, label: 'Has media' },
  { id: 'avg-sentence-length', category: 'contentReadability', passed: true, label: 'Avg sentence <= 20 words' },
  { id: 'consecutive-sentences', category: 'contentReadability', passed: true, label: 'No 3+ consecutive same-start' },
];

// Calculate score
let earnedPoints = 0;
let totalPoints = 0;

for (const check of checks) {
  if (SOFT_BONUS_CHECK_IDS.has(check.id)) continue;
  const weight = CATEGORY_WEIGHTS[check.category];
  totalPoints += weight;
  if (check.passed) earnedPoints += weight;
}

const baseScore = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
const softBonus = checks
  .filter((c) => SOFT_BONUS_CHECK_IDS.has(c.id) && c.passed)
  .reduce((total) => total + SOFT_BONUS_POINTS, 0);
const score = Math.min(100, baseScore + softBonus);

console.log("\n=== SEO Score Simulation ===");
console.log(`Total points possible: ${totalPoints}`);
console.log(`Earned points: ${earnedPoints}`);
console.log(`Base score: ${baseScore}/100`);
console.log(`Soft bonus: +${softBonus}`);
console.log(`Final score: ${score}/100`);
console.log(`Color: ${score <= 50 ? 'red' : score <= 80 ? 'orange' : 'green'}`);
console.log("\n--- Individual Checks ---");
for (const check of checks) {
  const isSoft = SOFT_BONUS_CHECK_IDS.has(check.id);
  console.log(`${check.passed ? '✅' : '❌'} ${check.label}${isSoft ? ' [SOFT]' : ''}`);
}
