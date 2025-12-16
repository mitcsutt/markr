import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleImport } from './import';

// Mock the db service
vi.mock('@repo/db/services/import', () => ({
  importTestResults: vi.fn(),
}));

import { importTestResults } from '@repo/db/services/import';

const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    headers: { 'content-type': 'text/xml+markr' },
    body: '',
    ...overrides,
  }) as Request;

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

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

describe('handleImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(importTestResults).mockResolvedValue([]);
  });

  describe('content-type validation', () => {
    it('returns 415 for wrong content-type', async () => {
      const req = createMockRequest({
        headers: { 'content-type': 'application/json' },
      });
      const res = createMockResponse();

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unsupported Media Type' }),
      );
    });

    it('accepts text/xml+markr content-type', async () => {
      const req = createMockRequest({ body: validXml });
      const res = createMockResponse();

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('body validation', () => {
    it('returns 400 for empty body', async () => {
      const req = createMockRequest({ body: '' });
      const res = createMockResponse();

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Request body must be XML' }),
      );
    });

    it('returns 400 for non-string body', async () => {
      const req = createMockRequest({
        body: { foo: 'bar' } as unknown as string,
      });
      const res = createMockResponse();

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('XML parsing', () => {
    it('returns 400 for invalid XML structure', async () => {
      const req = createMockRequest({ body: '<wrong-root></wrong-root>' });
      const res = createMockResponse();

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('missing mcq-test-results'),
        }),
      );
    });
  });

  describe('data validation', () => {
    it('returns 400 for invalid data (empty required fields)', async () => {
      const invalidXml = `
        <?xml version="1.0" encoding="UTF-8" ?>
        <mcq-test-results>
          <mcq-test-result>
            <first-name></first-name>
            <last-name></last-name>
            <student-number></student-number>
            <test-id></test-id>
            <summary-marks available="0" obtained="0" />
          </mcq-test-result>
        </mcq-test-results>
      `;
      const req = createMockRequest({ body: invalidXml });
      const res = createMockResponse();

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation Error' }),
      );
    });
  });

  describe('successful import', () => {
    it('calls importTestResults with parsed data', async () => {
      const req = createMockRequest({ body: validXml });
      const res = createMockResponse();
      vi.mocked(importTestResults).mockResolvedValue([{ id: 1 }] as never);

      await handleImport(req, res);

      expect(importTestResults).toHaveBeenCalledTimes(1);
      expect(importTestResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Doe',
            studentNumber: '12345',
            testId: '9863',
          }),
        ]),
      );
    });

    it('returns 200 with count', async () => {
      const req = createMockRequest({ body: validXml });
      const res = createMockResponse();
      vi.mocked(importTestResults).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ] as never);

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Import successful',
        count: 2,
      });
    });
  });

  describe('error handling', () => {
    it('returns 400 for Error exceptions', async () => {
      const req = createMockRequest({ body: validXml });
      const res = createMockResponse();
      vi.mocked(importTestResults).mockRejectedValue(
        new Error('DB connection failed'),
      );

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'DB connection failed' }),
      );
    });

    it('returns 500 for unknown exceptions', async () => {
      const req = createMockRequest({ body: validXml });
      const res = createMockResponse();
      vi.mocked(importTestResults).mockRejectedValue('unknown error');

      await handleImport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Internal Server Error' }),
      );
    });
  });
});
