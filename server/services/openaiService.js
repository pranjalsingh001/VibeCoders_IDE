const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Sends a prompt to Groq's AI (Llama 3/Mixtral) and returns the response.
 * @param {string} prompt - The user's input message.
 * @param {Object} options - Additional options for the request.
 * @returns {Promise<string>} - AI-generated response.
 */
const getAIResponse = async (prompt, options = {}) => {
  // Check if API key is available
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please configure your API key in server/.env");
  }

  // Validate prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string");
  }

  const requestOptions = {
    model: options.model || "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: options.temperature || 0.2,
    max_tokens: options.maxTokens || 2048, // Increased for better code generation
    ...options
  };

  try {
    console.log(`🤖 Sending request to Groq API (model: ${requestOptions.model}, tokens: ${requestOptions.max_tokens})`);

    const response = await axios.post(
      GROQ_API_URL,
      requestOptions,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        timeout: options.timeout || 60000, // 60 second timeout for code generation
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from AI service");
    }

    console.log(`✅ AI response received (${content.length} characters)`);
    return content;

  } catch (err) {
    console.error("❌ Groq API Error:", {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      code: err.code,
      promptLength: prompt.length
    });

    // Provide more specific error messages
    if (err.response?.status === 401) {
      throw new Error("Invalid GROQ_API_KEY. Please check your API key configuration in server/.env");
    } else if (err.response?.status === 429) {
      const retryAfter = err.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before making more requests.`);
    } else if (err.response?.status === 400) {
      throw new Error(`Bad request: ${err.response?.data?.error?.message || 'Please check your prompt format.'}`);
    } else if (err.response?.status === 402) {
      throw new Error("Insufficient credits. Please check your Groq account balance.");
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error("Network connection failed. Please check your internet connection and firewall settings.");
    } else if (err.code === 'ETIMEDOUT') {
      throw new Error("Request timed out. The AI service is taking too long to respond.");
    } else if (err.code === 'ECONNRESET') {
      throw new Error("Connection reset. Please try again.");
    } else {
      throw new Error(`Failed to fetch response from AI: ${err.message}`);
    }
  }
};

/**
 * Test the AI service connection
 * @returns {Promise<boolean>} - True if connection is working
 */
const testAIConnection = async () => {
  try {
    const testPrompt = "Hello! Please respond with just the word 'OK' to confirm you're working.";
    const response = await getAIResponse(testPrompt, {
      max_tokens: 10,
      temperature: 0.1
    });
    return response.toLowerCase().includes('ok');
  } catch (error) {
    console.error("AI connection test failed:", error.message);
    return false;
  }
};

module.exports = { getAIResponse, testAIConnection };
