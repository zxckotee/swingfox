const request = require('supertest');
const app = require('../server');

describe('Subscriptions API', () => {
  let testToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test user and token
    // This would typically be done in a test setup file
    testToken = 'test_token_placeholder';
    testUserId = 'test_user_123';
  });

  describe('GET /subscriptions/current', () => {
    test('should return correct structure for user with subscription', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
        
      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('expires_at');
      expect(response.body).toHaveProperty('auto_renew');
      expect(response.body).toHaveProperty('days_remaining');
      expect(response.body).toHaveProperty('has_subscription');
    });

    test('should return correct structure for user without subscription', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
        
      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('expires_at');
      expect(response.body).toHaveProperty('auto_renew');
      expect(response.body).toHaveProperty('days_remaining');
      expect(response.body.has_subscription).toBe(false);
    });
  });

  describe('POST /subscriptions/cancel', () => {
    test('should cancel subscription without requiring subscription ID', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('отменена');
    });

    test('should return 404 if no active subscription found', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(404);
        
      expect(response.body.error).toBe('subscription_not_found');
    });
  });



  describe('GET /subscriptions/history', () => {
    test('should return subscriptions and payments arrays', async () => {
      const response = await request(app)
        .get('/api/subscriptions/history')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
        
      expect(response.body).toHaveProperty('subscriptions');
      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.subscriptions)).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
  });

  describe('POST /subscriptions/validate-promo', () => {
    test('should validate promo code with default values', async () => {
      const response = await request(app)
        .post('/api/subscriptions/validate-promo')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ promo_code: 'WELCOME10' })
        .expect(200);
        
      expect(response.body).toHaveProperty('discount_amount');
      expect(response.body).toHaveProperty('final_price');
    });

    test('should work with explicit subscription_type and duration', async () => {
      const response = await request(app)
        .post('/api/subscriptions/validate-promo')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ 
          promo_code: 'PREMIUM30',
          subscription_type: 'PREMIUM',
          duration_months: 3
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('discount_amount');
    });
  });
});
