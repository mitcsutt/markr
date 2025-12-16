import { describe, expect, it } from 'vitest';
import { parseTestResults } from './xml';

describe('parseTestResults', () => {
  const validXml = `
    <?xml version="1.0" encoding="UTF-8" ?>
    <mcq-test-results>
      <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
        <first-name>Jane</first-name>
        <last-name>Doe</last-name>
        <student-number>12345</student-number>
        <test-id>9863</test-id>
        <summary-marks available="20" obtained="15" />
      </mcq-test-result>
    </mcq-test-results>
  `;

  describe('valid XML', () => {
    it('parses a single test result', () => {
      const results = parseTestResults(validXml);

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('Jane');
      expect(results[0].lastName).toBe('Doe');
      expect(results[0].studentNumber).toBe('12345');
      expect(results[0].testId).toBe('9863');
      expect(results[0].obtained).toBe(15);
      expect(results[0].available).toBe(20);
    });

    it('parses scannedOn as Date', () => {
      const results = parseTestResults(validXml);

      expect(results[0].scannedOn).toBeInstanceOf(Date);
    });

    it('preserves raw payload', () => {
      const results = parseTestResults(validXml);

      expect(results[0].rawPayload).toBeDefined();
      expect(results[0].rawPayload['first-name']).toBe('Jane');
    });

    it('parses multiple test results', () => {
      const multiXml = `
        <?xml version="1.0" encoding="UTF-8" ?>
        <mcq-test-results>
          <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
            <first-name>Jane</first-name>
            <last-name>Doe</last-name>
            <student-number>12345</student-number>
            <test-id>9863</test-id>
            <summary-marks available="20" obtained="15" />
          </mcq-test-result>
          <mcq-test-result scanned-on="2017-12-04T12:13:10+11:00">
            <first-name>John</first-name>
            <last-name>Smith</last-name>
            <student-number>67890</student-number>
            <test-id>9863</test-id>
            <summary-marks available="20" obtained="18" />
          </mcq-test-result>
        </mcq-test-results>
      `;

      const results = parseTestResults(multiXml);

      expect(results).toHaveLength(2);
      expect(results[0].firstName).toBe('Jane');
      expect(results[1].firstName).toBe('John');
    });
  });

  describe('invalid XML', () => {
    it('throws on missing root element', () => {
      const invalidXml = `
        <?xml version="1.0" encoding="UTF-8" ?>
        <wrong-root>
          <mcq-test-result></mcq-test-result>
        </wrong-root>
      `;

      expect(() => parseTestResults(invalidXml)).toThrow(
        'Invalid XML: missing mcq-test-results root element',
      );
    });

    it('throws on empty results', () => {
      // Empty mcq-test-results parses as missing the root element content
      const emptyXml = `
        <?xml version="1.0" encoding="UTF-8" ?>
        <mcq-test-results>
        </mcq-test-results>
      `;

      expect(() => parseTestResults(emptyXml)).toThrow('Invalid XML');
    });
  });

  describe('missing fields', () => {
    it('defaults missing string fields to empty string', () => {
      const minimalXml = `
        <?xml version="1.0" encoding="UTF-8" ?>
        <mcq-test-results>
          <mcq-test-result>
            <summary-marks available="20" obtained="15" />
          </mcq-test-result>
        </mcq-test-results>
      `;

      const results = parseTestResults(minimalXml);

      expect(results[0].firstName).toBe('');
      expect(results[0].lastName).toBe('');
      expect(results[0].studentNumber).toBe('');
      expect(results[0].testId).toBe('');
    });

    it('defaults missing marks to 0', () => {
      const noMarksXml = `
        <?xml version="1.0" encoding="UTF-8" ?>
        <mcq-test-results>
          <mcq-test-result>
            <first-name>Jane</first-name>
            <last-name>Doe</last-name>
            <student-number>12345</student-number>
            <test-id>9863</test-id>
          </mcq-test-result>
        </mcq-test-results>
      `;

      const results = parseTestResults(noMarksXml);

      expect(results[0].obtained).toBe(0);
      expect(results[0].available).toBe(0);
    });
  });
});
