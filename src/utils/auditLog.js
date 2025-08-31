class AuditLog {
  static logFinancialOperation(userId, operation, amount, details) {
    console.log(`🔍 [AUDIT] User: ${userId}, Operation: ${operation}, Amount: ${amount}, Details:`, details);
  }
  
  static logSubscriptionChange(userId, oldStatus, newStatus, reason) {
    console.log(`🔍 [AUDIT] User: ${userId}, Status: ${oldStatus} -> ${newStatus}, Reason: ${reason}`);
  }
  
  static logAdminAction(adminId, action, targetUserId, details) {
    console.log(`🔍 [AUDIT] Admin: ${adminId}, Action: ${action}, Target: ${userId}, Details:`, details);
  }
  
  static logPromoCodeUsage(userId, promoCode, discount, subscriptionType) {
    console.log(`🔍 [AUDIT] User: ${userId}, Promo: ${promoCode}, Discount: ${discount}, Type: ${subscriptionType}`);
  }
  
  static logAutoRenewalChange(userId, subscriptionId, enabled) {
    console.log(`🔍 [AUDIT] User: ${userId}, Subscription: ${subscriptionId}, Auto-renewal: ${enabled}`);
  }
  
  static logPlanChange(userId, oldPlan, newPlan, cost) {
    console.log(`🔍 [AUDIT] User: ${userId}, Plan change: ${oldPlan} -> ${newPlan}, Cost: ${cost}`);
  }
}

module.exports = AuditLog;
