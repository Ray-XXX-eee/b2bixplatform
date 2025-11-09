// src/services/chatService.js

/**
 * ChatService
 * Handles Gemini 2.0 Flash API streaming requests with real-time chunk updates.
 * Designed for React apps with streaming message updates.
 */

class ChatService {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn("⚠️ Gemini API key missing — please set VITE_GOOGLE_API_KEY in your .env file");
    }
    this.apiKey = apiKey;
    this.model = "gemini-2.0-flash";
  }

  /**
   * Generates a unique session ID (UUID v4 style)
   */
  generateSessionId(prefix = "gemini") {
    const randomGuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return `${prefix}_${randomGuid}`;
  }

  /**
   * Send a message to Gemini 2.0 Flash (Streaming)
   * 
   * @param {string} message - The user's input text
   * @param {function(string):void} onChunk - Callback fired for each partial text chunk
   * @param {function(string):void} onComplete - Callback when the stream finishes
   * @param {string} [sessionId] - Optional session ID for continuity
   * @returns {Promise<{session_id: string, message: string}>}
   */
  async sendMessageStream(message, onChunk, onComplete, sessionId = "") {
    if (!this.apiKey) throw new Error("Missing Gemini API key.");

    const finalSessionId = sessionId || this.generateSessionId();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    };

    console.log("🚀 [Gemini] Sending streaming request:", message);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini stream request failed:", response.status, errorText);
      throw new Error(`Gemini stream request failed: ${response.status} - ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const textPart = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              accumulatedText += textPart;
              if (onChunk) onChunk(textPart);
            }
          } catch (e) {
            // Ignore partial JSON chunks — they will complete in the next loop
          }
        }
      }

      if (!accumulatedText) {
        console.warn("⚠️ Gemini returned an empty response.");
      }

      if (onComplete) onComplete(accumulatedText);

      return {
        session_id: finalSessionId,
        message: accumulatedText,
      };
    } catch (streamError) {
      console.error("🔥 Stream error:", streamError);
      if (onComplete)
        onComplete("⚠️ Gemini streaming failed. Please check your network or API key.");
      throw streamError;
    } finally {
      reader.releaseLock();
    }
  }
}

// ✅ Create a single shared instance (initialized with your .env key)
const chatService = new ChatService(
  import.meta.env.VITE_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY
);

export default chatService;
