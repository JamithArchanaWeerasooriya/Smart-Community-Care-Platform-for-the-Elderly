import dotenv from "dotenv";
dotenv.config(); // ✅ load .env FIRST

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import OpenAI from "openai";


// ==============================
// 🎧 AUDIO ANALYSIS FUNCTION
// ==============================
export const analyzeAudio = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append("audio", fs.createReadStream(filePath));

    const response = await axios.post(
      "http://localhost:5001/api/sleep/predict",
      formData,
      {
        headers: formData.getHeaders(),
      }
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
export const getAIResponse = async (message, sleepData) => {
  try {
    // 🔍 Debug check
    console.log("API KEY:", process.env.OPENAI_API_KEY);

    // ❗ If key missing → stop early
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key missing");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ✅ safest working model
      messages: [
        {
          role: "system",
          content: `You are an AI Sleep Assistant.
Help users improve sleep quality.
Keep answers short, simple, and friendly.
Use this sleep data if available:
${sleepData ? JSON.stringify(sleepData) : "No data"}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    // ✅ safe return
    return response.choices?.[0]?.message?.content || "No response";

  } catch (error) {
    // 🔥 FULL ERROR (very important for debugging)
    console.error("❌ OpenAI FULL ERROR:", error);

    // return clean message to frontend
    return "Sorry, AI is not available right now.";
  }
};