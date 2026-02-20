/**
 * Helpers for traceability tagging in Playwright reports.
 */

/**
 * PUBLIC_INTERFACE
 * Tag a Playwright test with a user story id + test case id.
 *
 * Uses Playwright annotations so HTML reports contain explicit traceability.
 *
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string|number} storyId
 * @param {string} testCaseId
 * @param {string} [title]
 */
export function tagStoryAndCase(testInfo, storyId, testCaseId, title) {
  testInfo.annotations.push({ type: "story", description: `US-${storyId}` });
  testInfo.annotations.push({ type: "test_case", description: testCaseId });
  if (title) testInfo.annotations.push({ type: "title", description: title });
}
