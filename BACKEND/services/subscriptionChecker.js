// utils/subscriptionChecker.js

exports.checkAndResetSubscription = async (db, user) => {
  if (!user || !user.is_subscribed || !user.subscription_expiry_date) return;

  const now = new Date();
  const expiry = new Date(user.subscription_expiry_date);

  if (expiry < now) {
    await db.collection('users').updateOne(
      { user_id: user.user_id },
      {
        $set: { is_subscribed: false },
        $unset: {
          subscribed_at: "",
          subscription_expiry_date: "",
          active_label: "",
          active_plan_id: "",
          active_duration_id: "",
          active_order_id: "",
          assigned_device_ids: ""
        }
      }
    );
    console.log(`✅ Subscription expired. Reset done for user_id: ${user.user_id}`);
  }
};
