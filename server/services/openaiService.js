// openaiService.js

// If using OpenAI:
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = "https://api.deepseek.com/v1/chat/completions"; // Replace with DeepSeek if different

/**
 * Sends a prompt to the AI and returns the response.
 * @param {string} prompt - The message to send to the AI.
 */
const getAIResponse = async (prompt) => {
  try {
    const response = await axios.post(
      BASE_URL,
      {
        model: "deepseek-coder", // adjust as needed
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ Error in openaiService:", err.message);
    throw new Error("Failed to fetch response from AI");
  }
};

module.exports = { getAIResponse };
