import { describe, it, expect } from 'vitest';
import { extractEvidenceIdFromReceipt } from './transactions';
import { MODULE_ADDRESS, MODULE_NAME } from './client';

describe('extractEvidenceIdFromReceipt', () => {
  it('should return null if receipt or events are missing', () => {
    expect(extractEvidenceIdFromReceipt(null)).toBeNull();
    expect(extractEvidenceIdFromReceipt({})).toBeNull();
    expect(extractEvidenceIdFromReceipt({ events: [] })).toBeNull();
  });

  it('should extract the evidence ID if the correct event is present', () => {
    const mockReceipt = {
      events: [
        {
          type: '0x1::some_other_module::OtherEvent',
          data: { id: '999' }
        },
        {
          type: `${MODULE_ADDRESS}::${MODULE_NAME}::EvidenceRegisteredEvent`,
          data: {
            id: '123',
            publisher: '0xabc',
            timestamp: '1690000000'
          }
        }
      ]
    };

    expect(extractEvidenceIdFromReceipt(mockReceipt)).toBe('123');
  });

  it('should return null if the event is present but has no id', () => {
    const mockReceipt = {
      events: [
        {
          type: `${MODULE_ADDRESS}::${MODULE_NAME}::EvidenceRegisteredEvent`,
          data: {
            publisher: '0xabc'
          }
        }
      ]
    };

    expect(extractEvidenceIdFromReceipt(mockReceipt)).toBeNull();
  });

  it('should handle numeric ids and convert to string', () => {
    const mockReceipt = {
      events: [
        {
          type: `${MODULE_ADDRESS}::${MODULE_NAME}::EvidenceRegisteredEvent`,
          data: {
            id: 456
          }
        }
      ]
    };

    expect(extractEvidenceIdFromReceipt(mockReceipt)).toBe('456');
  });
});
