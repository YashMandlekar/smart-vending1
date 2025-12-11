// api/create-order.js  (Vercel Serverless Backend)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { amount, items } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET = process.env.CASHFREE_SECRET;

    if (!APP_ID || !SECRET) {
      return res.status(500).json({
        success: false,
        error: "Cashfree API keys not configured",
      });
    }

    // Cashfree Order Payload
    const orderPayload = {
      order_id: "order_" + Date.now(),
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + Date.now(),
        customer_email: "dummy@nodata.com",   // USER DOES NOT ENTER
        customer_phone: "9999999999"          // USER DOES NOT ENTER
      }
    };

    // Call Cashfree Orders API
    const r = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET
      },
      body: JSON.stringify(orderPayload)
    });

    const json = await r.json();
    const orderObject = json?.data || json;

    return res.status(200).json({
      success: true,
      order: orderObject,
      items: items || []
    });

  } catch (err) {
    console.error("Order Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Unknown error"
    });
  }
}
