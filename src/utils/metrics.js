class SubscriptionMetrics {
  static recordSubscriptionCreated(type, amount) {
    console.log(`📊 [METRICS] Subscription created: ${type}, amount: ${amount}`);
  }
  
  static recordSubscriptionCancelled(type, reason) {
    console.log(`📊 [METRICS] Subscription cancelled: ${type}, reason: ${reason}`);
  }
  
  static recordAutoRenewal(type, success) {
    console.log(`📊 [METRICS] Auto renewal: ${type}, success: ${success}`);
  }
  
  static recordPlanChange(oldType, newType, amount) {
    console.log(`📊 [METRICS] Plan changed: ${oldType} -> ${newType}, amount: ${amount}`);
  }
  
  static recordPromoCodeUsed(code, discount, subscriptionType) {
    console.log(`📊 [METRICS] Promo code used: ${code}, discount: ${discount}, type: ${subscriptionType}`);
  }
  
  static recordPaymentSuccess(method, amount, subscriptionType) {
    console.log(`📊 [METRICS] Payment success: ${method}, amount: ${amount}, type: ${subscriptionType}`);
  }
  
  static recordPaymentFailure(method, amount, error) {
    console.log(`📊 [METRICS] Payment failed: ${method}, amount: ${amount}, error: ${error}`);
  }
}

module.exports = SubscriptionMetrics;
