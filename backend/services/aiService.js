const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const OpenAI = require("openai");


// ==============================
// 🎧 AUDIO ANALYSIS FUNCTION
// ==============================
const analyzeAudio = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append("audio", fs.createReadStream(filePath));

    const response = await axios.post(
      "http://localhost:5001/api/sleep/predict",
      formData,
      { headers: formData.getHeaders() }
    );

    return response.data;

  } catch (error) {
    console.error("Audio AI error:", error.message);
    return null;
  }
};


// ==============================
// 💬 AI CHAT FUNCTION
// ==============================
const getAIResponse = async (message, sleepData, lang = "en") => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key missing");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isSinhala = lang === "si";

    // ── Language-specific formatting rules ─────────────────────────────
    const formatRules = isSinhala
      ? `IMPORTANT FORMATTING RULES FOR SINHALA:
- Respond ENTIRELY in Sinhala (සිංහල).
- Do NOT use any markdown symbols like **, *, ##, or __.
- For numbered lists, just use plain: "1. ", "2. ", "3. " at the start of each line.
- Write bold words as PLAIN TEXT — no asterisks.
- Keep sentences short and easy to understand.
- Use simple everyday Sinhala, not formal/archaic words.`
      : `FORMATTING RULES:
- Use **bold** only for key terms or headings.
- Use numbered lists (1. 2. 3.) for steps.
- Use bullet points (- ) for tips.
- Keep answers concise — 2 to 5 sentences or a short list.`;

    // ── Sleep data context ─────────────────────────────────────────────
    const sleepContext = sleepData
      ? `
User's recent sleep data:
- Snore Level: ${sleepData.snoreLevel}
- Snore Duration: ${sleepData.snoreDuration} minutes
- Snore Frequency: ${(sleepData.snoreFrequency || 0).toFixed(1)}%
- Sleep Duration: ${sleepData.totalSleepDuration ? (sleepData.totalSleepDuration / 3600).toFixed(1) + " hours" : "unknown"}
- Sleep Score: ${sleepData.sleepScore}/100
- Factors: ${JSON.stringify(sleepData.factors || {})}
${(sleepData.snoreFrequency || 0) > 15 ? "⚠ High snoring — mention possible mild sleep apnea." : ""}
${(sleepData.totalSleepDuration || 0) < 25200 ? "⚠ Sleep under 7 hours — recommend more rest." : ""}`
      : "No sleep data available yet.";

    // ── Full system prompt ─────────────────────────────────────────────
    const systemPrompt = `You are an AI Sleep Assistant. You ONLY answer questions about sleep, rest, health, and wellbeing.
If a question is completely unrelated to sleep or health, politely say you only handle sleep topics.
Do NOT give dangerous medical advice. Always recommend seeing a doctor for serious symptoms.

${formatRules}

${sleepContext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message },
      ],
    });

    return response.choices?.[0]?.message?.content || "No response received.";

  } catch (error) {
    console.error("❌ OpenAI FULL ERROR:", error);
    return isSinhala(lang)
      ? "කණගාටුයි, AI දැන් ලබා ගත නොහැක. පසුව නැවත උත්සාහ කරන්න."
      : "Sorry, AI is not available right now. Please try again later.";
  }
};

// helper
function isSinhala(lang) {
  return lang === "si";
}

module.exports = {
  analyzeAudio,
  getAIResponse
};