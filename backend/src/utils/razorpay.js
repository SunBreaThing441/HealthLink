import Razorpay from 'razorpay';

let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
  });
} catch (err) {
  console.warn("⚠️ Razorpay initialization warning:", err.message);
}

export default razorpay;

