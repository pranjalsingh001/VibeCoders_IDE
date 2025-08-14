const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY; 
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Sends a prompt to Groq's AI (Llama 3/Mixtral) and returns the response.
 * @param {string} prompt - The user's input message.
 * @returns {Promise<string>} - AI-generated response.
 */
const getAIResponse = async (prompt) => {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-70b-8192", // Or "mixtral-8x7b-32768"
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7, // Optional: Controls randomness (0 to 1)
        max_tokens: 1024, // Optional: Limits response length
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    // Groq's response 
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ Groq API Error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    throw new Error("Failed to fetch response from AI");
  }
};

module.exports = { getAIResponse };