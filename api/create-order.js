export const config = {
  runtime: "nodejs",
};

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL:
      "https://smartvending-a7db9-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { amount, items } = req.body;
    const orderId = "order_" + Date.now();

    const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
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

    const cfData = await cfRes.json();
    console.log("Cashfree Response:", cfData);

    if (!cfData.payment_session_id) {
      return res.status(500).json({
        success: false,
        error: "Payment session missing",
        cfData,
      });
    }

    const db = getDatabase();
    await db.ref("orders/" + orderId).set({
      orderId,
      amount,
      items,
      status: "PENDING",
      session: cfData.payment_session_id,
      timestamp: Date.now(),
    });

    res.status(200).json({
      success: true,
      payment_session_id: cfData.payment_session_id,
      orderId,
    });
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
