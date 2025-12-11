import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// -------------------------------
//  FIREBASE CONFIG (YOUR VALUES)
// -------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAPTlRQNFK2xqtRgT6OxEKDX7UphhsIC1c",
  authDomain: "smartvending-a7db9.firebaseapp.com",
  databaseURL: "https://smartvending-a7db9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartvending-a7db9",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -------------------------------
//  MAIN API HANDLER
// -------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { amount, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // SECURITY: Hide keys in Vercel env
    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

    if (!APP_ID || !SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: "Cashfree keys missing in Vercel Environment Variables",
      });
    }

    // Generate unique order ID
    const orderId = "order_" + Date.now();

    // --------------------------------------
    //  CALL CASHFREE — CREATE PAYMENT SESSION
    // --------------------------------------
    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-client-id": APP_ID,
        "x-client-secret": SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_" + Date.now(),
          customer_email: "no-email@system.com",
          customer_phone: "9999999999",
        },
      }),
    });

    const cashfree = await response.json();

    if (!cashfree?.payment_session_id) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate payment session",
        cashfree,
      });
    }

    // --------------------------------------
    // SAVE INITIAL ORDER IN FIREBASE
    // --------------------------------------
    await set(ref(db, "orders/" + orderId), {
      orderId,
      amount,
      items,
      status: "PENDING", // WAITING FOR PAYMENT
      payment_session_id: cashfree.payment_session_id,
      timestamp: Date.now(),
    });

    // --------------------------------------
    // RETURN SESSION TO FRONTEND
    // --------------------------------------
    return res.status(200).json({
      success: true,
      orderId,
      payment_session_id: cashfree.payment_session_id,
    });

  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
}


