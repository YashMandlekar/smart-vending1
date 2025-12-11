export const config = {
  runtime: "nodejs", // IMPORTANT (Edge runtime Firebase nahi chalata)
};

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// 🟢 Initialize Firebase Admin (ONLY once)
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
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const event = req.body;

    console.log("Webhook Received:", event);

    const orderId = event?.data?.order_id;
    const amount = event?.data?.order_amount;
    const status = event?.data?.order_status;

    if (!orderId) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // 🟢 Write to Firebase
    const db = getDatabase();
    await db.ref("payments/" + orderId).set({
      orderId,
      amount,
      status,
      timestamp: Date.now(),
      raw: event,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
