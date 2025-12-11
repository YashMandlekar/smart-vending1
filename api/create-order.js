export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

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
        customer_email: "noreply@test.com",
        customer_phone: "9999999999"
      }
    };

    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
        "x-api-version": "2022-01-01"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Cashfree response:", data);

    if (!data.payment_session_id) {
      return res.status(500).json({
        success: false,
        error: "Payment session missing",
        cashfree: data
      });
    }

    return res.status(200).json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: payload.order_id
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

