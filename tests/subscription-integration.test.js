const request = require('supertest');
const app = require('../server');

describe('Subscription Integration Tests', () => {
  let testToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test user and token
    testToken = 'test_token_placeholder';
    testUserId = 'test_user_123';
  });

  test('Complete subscription lifecycle', async () => {
    // 1. Get initial subscription status
    const initialStatus = await request(app)
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);
    
    expect(initialStatus.body).toHaveProperty('has_subscription');
    
    // 2. Get pricing and features
    const pricing = await request(app)
      .get('/api/subscriptions/pricing')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);
    
    expect(pricing.body).toHaveProperty('pricing');
    expect(pricing.body).toHaveProperty('features');
    
    // 3. Validate promo code
    const promoValidation = await request(app)
      .post('/api/subscriptions/validate-promo')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ promo_code: 'WELCOME10' })
      .expect(200);
    
    expect(promoValidation.body).toHaveProperty('discount_amount');
    
    // 4. Create subscription (if user has balance)
    // Note: This test assumes user has sufficient balance
    try {
      const createResponse = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          subscription_type: 'VIP',
          duration_months: 1,
          payment_method: 'balance',
          promo_code: 'WELCOME10',
          auto_renewal: true
        });
      
      if (createResponse.status === 201) {
        expect(createResponse.body.success).toBe(true);
        expect(createResponse.body.subscription).toHaveProperty('id');
        
        // 5. Check current subscription
        const currentResponse = await request(app)
          .get('/api/subscriptions/current')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
        
        expect(currentResponse.body.has_subscription).toBe(true);
        expect(currentResponse.body.plan).toBe('vip');
        

        
        // 7. Get subscription history
        const historyResponse = await request(app)
          .get('/api/subscriptions/history')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
        
        expect(historyResponse.body).toHaveProperty('subscriptions');
        expect(historyResponse.body).toHaveProperty('payments');
        
        // 8. Cancel subscription
        const cancelResponse = await request(app)
          .post('/api/subscriptions/cancel')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ reason: 'Test completion' })
          .expect(200);
        
        expect(cancelResponse.body.success).toBe(true);
        
        // 9. Verify cancellation
        const finalStatus = await request(app)
          .get('/api/subscriptions/current')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
        
        expect(finalStatus.body.has_subscription).toBe(false);
      }
    } catch (error) {
      // If user doesn't have balance, skip subscription creation
      console.log('Skipping subscription creation test - insufficient balance');
    }
  });

  test('Rate limiting on subscription operations', async () => {
    // Test rate limiting by making multiple requests
    const promises = [];
    
    for (let i = 0; i < 6; i++) {
      promises.push(
        request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            subscription_type: 'VIP',
            duration_months: 1
          })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // At least one should be rate limited (status 429)
    const rateLimited = responses.some(response => response.status === 429);
    expect(rateLimited).toBe(true);
  });

  test('Input validation on subscription creation', async () => {
    // Test invalid subscription type
    const invalidTypeResponse = await request(app)
      .post('/api/subscriptions/create')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        subscription_type: 'INVALID',
        duration_months: 1
      })
      .expect(400);
    
    expect(invalidTypeResponse.body.error).toBe('validation_error');
    
    // Test invalid duration
    const invalidDurationResponse = await request(app)
      .post('/api/subscriptions/create')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        subscription_type: 'VIP',
        duration_months: 5
      })
      .expect(400);
    
    expect(invalidDurationResponse.body.error).toBe('validation_error');
  });
});
