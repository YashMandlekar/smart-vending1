import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "smartvending-a7db9",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://smartvending-a7db9-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "POST only" });

  try {
    const { amount, items } = req.body;
    const orderId = "order_" + Date.now();

    // Create Cashfree V3 Order
    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust123",
          customer_email: "noemail@sys.com",
          customer_phone: "9999999999",
        },
      }),
    });

    const data = await response.json();

    if (!data.payment_session_id) {
      return res.status(500).json({
        success: false,
        error: "Payment session missing",
        raw: data,
      });
    }

    // Save to Firebase (ADMIN SDK)
    const db = getDatabase();
    await db.ref("orders/" + orderId).set({
      orderId,
      amount,
      items,
      status: "PENDING",
      payment_session_id: data.payment_session_id,
      timestamp: Date.now(),
    });

    return res.status(200).json({
      success: true,
      payment_session_id: data.payment_session_id,
      orderId,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}

