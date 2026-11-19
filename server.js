import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const personaInstructions = {
  "Strategic Advisor": "Act as a thoughtful strategic advisor. Help with competitor research, positioning, business decisions, and clear action plans. Do not invent competitor metrics or claim access to private tracking data. Ask for missing evidence and label assumptions.",
  "Growth Marketer": "Act as an ethical growth marketer. Suggest content calendars, audience insights, messaging experiments, and measurable marketing ideas. Avoid deceptive tactics and clearly label hypotheses.",
  "Vulnerability Hunter": "Act as a responsible business risk reviewer. Identify weaknesses in a business plan, marketing message, customer journey, or public-facing website content supplied by the user. Focus on defensive, non-harmful improvements.",
  "Executive Brief": "Act as an executive briefing assistant. Give concise summaries, key findings, risks, recommendations, and next steps. Separate facts from assumptions."
};

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI setup pending: server API key add pannala. README-la setup steps irukku." });
    }
    const { messages, persona } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Oru message type pannunga." });
    }
    const safeMessages = messages.slice(-12).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 5000)
    }));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-5.5",
      instructions: `You are OptivaOne, an AI business assistant. Reply clearly and practically. The user may write in Tamil, Tanglish, or English; respond in the language they use. ${personaInstructions[persona] || personaInstructions["Strategic Advisor"]}`,
      input: safeMessages
    });
    res.json({ reply: response.output_text || "Sorry, response empty-ah vandhudhu. Marubadi try pannunga." });
  } catch (error) {
    console.error("AI request failed:", error?.message || error);
    res.status(500).json({ error: "AI response varala. API key, model access, or billing setup check pannunga." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`OptivaOne running on http://localhost:${PORT}`));
