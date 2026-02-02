/**
 * Tests for analytics event validation
 */

import {
  validateEventName,
  validateProperties,
  validatePropertyCasing,
} from '@/analytics/validation';

describe('Analytics Validation', () => {
  describe('validateEventName', () => {
    it('should accept valid event names', () => {
      const validNames = [
        'web.session_started',
        'web.page_viewed',
        'web.link_clicked',
        'app.feature_used',
      ];

      validNames.forEach((name) => {
        expect(() => validateEventName(name)).not.toThrow();
      });
    });

    it('should reject invalid event names', () => {
      const invalidNames = [
        'invalidEvent',
        'web.invalid_event',
        'app.unknown_action',
      ];

      invalidNames.forEach((name) => {
        expect(validateEventName(name)).toBe(false);
      });
    });

    it('should reject empty event names', () => {
      expect(validateEventName('')).toBe(false);
    });
  });

  describe('validateProperties', () => {
    it('should accept properties with snake_case keys', () => {
      const validProps = {
        utm_source: 'google',
        utm_campaign: 'summer_sale',
        landing_path: '/products',
      };

      const result = validateProperties('web.session_started', validProps);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject properties with camelCase keys', () => {
      const invalidProps = {
        utmSource: 'google',
        landingPath: '/products',
      };

      const result = validateProperties('web.link_clicked', invalidProps);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/snake_case/);
    });

    it('should reject properties with PascalCase keys', () => {
      const invalidProps = {
        UtmSource: 'google',
      };

      const result = validateProperties('web.link_clicked', invalidProps);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/snake_case/);
    });

    it('should accept properties with numbers in keys', () => {
      const validProps = {
        item_1_id: '123',
        product_2_name: 'Widget',
      };

      const result = validateProperties('web.link_clicked', validProps);
      expect(result.valid).toBe(true);
    });

    it('should accept empty properties object', () => {
      const result = validateProperties('web.link_clicked', {});
      expect(result.valid).toBe(true);
    });

    it('should accept nested objects with snake_case keys', () => {
      const validProps = {
        user_data: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = validateProperties('web.link_clicked', validProps);
      expect(result.valid).toBe(true);
    });

    it('should accept arrays in properties', () => {
      const validProps = {
        product_ids: ['123', '456'],
        tag_list: ['sale', 'featured'],
      };

      const result = validateProperties('web.link_clicked', validProps);
      expect(result.valid).toBe(true);
    });

    it('should accept null and undefined values in properties', () => {
      const validProps = {
        optional_field: null,
        another_field: undefined,
        required_field: 'value',
      };

      const result = validatePropertyCasing(validProps);
      expect(result.valid).toBe(true);
    });
  });
});
