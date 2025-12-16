import type { TestResult } from '@repo/db/validators/submission';
import { XMLParser } from 'fast-xml-parser';

/**
 * Configured XML parser for Markr test results.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
});

/**
 * Parses raw XML and extracts the mcq-test-result array.
 * Throws if the root element is missing or no results are found.
 */
function extractResults(xmlBody: string): Record<string, unknown>[] {
  const parsed = parser.parse(xmlBody);

  if (!parsed['mcq-test-results']) {
    throw new Error('Invalid XML: missing mcq-test-results root element');
  }

  const results = parsed['mcq-test-results']['mcq-test-result'];
  const resultArray = Array.isArray(results) ? results : [results];

  if (!resultArray.length || !resultArray[0]) {
    throw new Error('Invalid XML: no test results found');
  }

  return resultArray;
}

/**
 * Maps a raw XML result object to a TestResult.
 */
function mapToTestResult(result: Record<string, unknown>): TestResult {
  const summaryMarks = result['summary-marks'] as
    | Record<string, unknown>
    | undefined;

  return {
    firstName: String(result['first-name'] ?? ''),
    lastName: String(result['last-name'] ?? ''),
    studentNumber: String(result['student-number'] ?? ''),
    testId: String(result['test-id'] ?? ''),
    obtained: Number(summaryMarks?.['@_obtained'] ?? 0),
    available: Number(summaryMarks?.['@_available'] ?? 0),
    scannedOn: new Date(
      String(result['@_scanned-on'] ?? new Date().toISOString()),
    ),
    rawPayload: { ...result },
  };
}

/**
 * Parses the XML body and extracts test results.
 */
export function parseTestResults(xmlBody: string): TestResult[] {
  const results = extractResults(xmlBody);
  return results.map(mapToTestResult);
}
