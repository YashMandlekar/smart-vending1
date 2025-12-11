export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Only POST allowed" });
  }

  try {
    const { amount, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // ENV in Vercel
    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET = process.env.CASHFREE_SECRET;

    if (!APP_ID || !SECRET) {
      return res.status(500).json({
        success: false,
        error: "Cashfree APP_ID or SECRET missing",
      });
    }

    const payload = {
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + Date.now(),
        customer_email: "no-reply@site.com",
        customer_phone: "9999999999"
      }
    };

    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
      items
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server crashed",
    });
  }
}

