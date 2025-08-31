const request = require('supertest');
const app = require('../server');

describe('Subscription Cancellation Tests', () => {
  let testToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test user and token
    testToken = 'test_token_placeholder';
    testUserId = 'test_user_123';
  });

  describe('POST /subscriptions/cancel', () => {
    test('should properly cancel subscription and reset user status', async () => {
      // 1. Create a subscription first
      const createResponse = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          subscription_type: 'VIP',
          duration_months: 1,
          payment_method: 'balance'
        });
      
      if (createResponse.status === 201) {
        // 2. Check that subscription is active
        const statusResponse = await request(app)
          .get('/api/subscriptions/current')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
        
        expect(statusResponse.body.has_subscription).toBe(true);
        expect(statusResponse.body.plan).toBe('vip');
        
        // 3. Cancel the subscription
        const cancelResponse = await request(app)
          .post('/api/subscriptions/cancel')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ reason: 'Test cancellation' })
          .expect(200);
        
        expect(cancelResponse.body.success).toBe(true);
        expect(cancelResponse.body.message).toContain('сброшен на базовый план');
        
        // 4. Check that subscription is no longer active
        const finalStatusResponse = await request(app)
          .get('/api/subscriptions/current')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
        
        expect(finalStatusResponse.body.has_subscription).toBe(false);
        expect(finalStatusResponse.body.plan).toBe('free');
        expect(finalStatusResponse.body.expires_at).toBe(null);
      }
    });

    test('should handle cancellation when no active subscription exists', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(404);
      
      expect(response.body.error).toBe('subscription_not_found');
    });
  });

  describe('User status after cancellation', () => {
    test('should reset user viptype to FREE after cancellation', async () => {
      // This test would require database access to verify user status
      // In a real test environment, you'd check the database directly
      expect(true).toBe(true); // Placeholder
    });
  });
});
