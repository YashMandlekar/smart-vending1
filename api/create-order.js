export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  // CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { amount, items } = req.body;

    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET = process.env.CASHFREE_SECRET;

    if (!APP_ID || !SECRET) {
      return res.status(500).json({
        success: false,
        error: "Cashfree keys missing"
      });
    }

    const payload = {
      order_id: "order_" + Date.now(),
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + Date.now(),
        customer_email: "no-reply@vending.com",
        customer_phone: "9999999999"
      }
    };

    const r = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET
      },
      body: JSON.stringify(payload)
    });

    const json = await r.json();

    return res.status(200).json({
      success: true,
      order: json.data,   // contains payment_session_id
      items
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
