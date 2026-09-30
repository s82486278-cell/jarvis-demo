require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname)); // sirve el index.html

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODELO_CHAT = "gemini-2.5-flash";
const MODELO_IMAGEN = "gemini-3.1-flash-image";

app.post("/api/chat", async (req, res) => {
  try {
    const { mensajes } = req.body;
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_CHAT}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: mensajes }),
      }
    );
    const data = await r.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return res.status(500).json({ error: "Sin respuesta", detalle: data });
    res.json({ respuesta: texto });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/generar-imagen", async (req, res) => {
  try {
    const { prompt } = req.body;
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO_IMAGEN,
        input: `Genera una imagen de: ${prompt}`,
        response_format: { type: "image", aspect_ratio: "1:1" },
      }),
    });
    const data = await r.json();
    const base64 = data.output_image?.data;
    if (!base64) return res.status(500).json({ error: "Sin imagen", detalle: data });
    res.json({ imagen: `data:image/png;base64,${base64}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Jarvis backend en puerto ${PORT}`));