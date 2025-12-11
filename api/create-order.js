export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { amount, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET = process.env.CASHFREE_SECRET;

    if (!APP_ID || !SECRET) {
      return res.status(500).json({ success: false, error: "Cashfree keys missing" });
    }

    const payload = {
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + Date.now(),
        customer_phone: "9999999999",
        customer_email: "no-reply@test.com"
      }
    };

    const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
      },
      body: JSON.stringify(payload),
    });

    const json = await cfRes.json();

    // 🌟 THIS IS THE MOST IMPORTANT FIX
    const payment_session_id = json?.payment_session_id;

    if (!payment_session_id) {
      return res.status(500).json({
        success: false,
        error: "Payment session missing",
        cashfree: json
      });
    }

    return res.status(200).json({
      success: true,
      payment_session_id,
      order: json,
      items: items || []
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
