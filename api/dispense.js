// FINAL PRODUCTION DISPENSE API
// Sends commands to Blynk to tell ESP which item to dispense.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST only" });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "No items provided" });
    }

    const TOKEN = process.env.BLYNK_TOKEN;
    if (!TOKEN) {
      return res.status(500).json({ success: false, error: "Missing Blynk token" });
    }

    // production mapping (DO NOT CHANGE unless you change Blynk pins)
    const MAP = {
      Water: 1,      // V0 = 1
      Juice: 2,      // V0 = 2
      Biscuit: 3     // V0 = 3
    };

    const results = [];

    for (const item of items) {
      const code = MAP[item];

      if (!code) {
        results.push({ item, ok: false, error: "Unknown item" });
        continue;
      }

      const url = `https://blynk.cloud/external/api/update?token=${TOKEN}&V0=${code}`;

      const r = await fetch(url);
      const txt = await r.text();

      results.push({
        item,
        code,
        ok: txt === "ok" || txt === "OK",
        response: txt
      });

      // small gap so ESP can process each command
      await new Promise((x) => setTimeout(x, 500));
    }

    return res.status(200).json({
      success: true,
      message: "Commands sent to Blynk",
      results
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
