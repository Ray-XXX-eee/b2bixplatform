// src/services/chatService.js

class ChatService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = "gemini-2.0-flash";
  }

  generateSessionId(prefix = "gemini") {
    const randomGuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return `${prefix}_${randomGuid}`;
  }

  /**
   * Send a message to Gemini 2.0 Flash (Streaming)
   * 
   * @param {string} message - The user's message
   * @param {function(string):void} onChunk - Callback for each streamed text chunk
   * @param {function(string):void} onComplete - Callback when streaming ends
   * @param {string} sessionId - Optional session ID
   * @returns {Promise<{session_id: string, message: string}>}
   */
  async sendMessageStream(message, onChunk, onComplete, sessionId = "") {
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

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini stream request failed: ${response.status} - ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const jsonLines = chunk.split("\n").filter(line => line.trim() !== "");

      for (const line of jsonLines) {
        try {
          const obj = JSON.parse(line);
          const textPart = obj?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            accumulatedText += textPart;
            if (onChunk) onChunk(textPart);
          }
        } catch {
          // Skip incomplete JSON lines
        }
      }
    }

    if (onComplete) onComplete(accumulatedText);

    return {
      session_id: finalSessionId,
      message: accumulatedText,
    };
  }
}

const chatService = new ChatService(import.meta.env.VITE_GOOGLE_API_KEY); // or process.env.GEMINI_API_KEY

export default chatService;
