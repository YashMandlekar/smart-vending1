export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const raw = await new Promise(resolve => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(data));
    });

    const event = JSON.parse(raw);

    if (event.type === "PAYMENT_SUCCESS") {
      const items = event.data.order.order_tags.items;  
      const token = process.env.BLYNK_TOKEN;

      await fetch(`https://blynk.cloud/external/api/update?token=${token}&V1=${items}`);

      return res.status(200).json({ success: true });
    }

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

