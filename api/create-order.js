export default async function handler(req, res) {
  try {
    const { amount, items } = req.body;
    const itemString = items.join(",");   // EX: "WATER,BISCUIT"

    const payload = {
      order_amount: amount,
      order_currency: "INR",
      order_tags: { items: itemString },
      customer_details: {
        customer_id: "cust_" + Date.now(),
        customer_phone: "9999999999",
        customer_email: "no-reply@test.com"
      }
    };

    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!json.payment_session_id) {
      return res.status(500).json({ success: false, error: "Session missing" });
    }

    res.status(200).json({
      success: true,
      payment_session_id: json.payment_session_id,
      order: json
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

