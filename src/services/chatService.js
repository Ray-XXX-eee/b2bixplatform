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
   * @deprecated - No longer needed for Gemini, kept for backward compatibility
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
   * @param {Array} [conversationHistory] - Optional conversation history for context
   * @returns {Promise<{message: string, conversationHistory: Array}>}
   */
  async sendMessageStream(message, onChunk, onComplete, conversationHistory = []) {
    if (!this.apiKey) throw new Error("Missing Gemini API key.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

    // Build conversation contents with history
    const contents = [
      ...conversationHistory,
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const requestBody = {
      contents,
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
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Gemini streams an array with comma-separated objects: [{...}, {...}, ...]
        // We need to extract complete objects as they arrive
        
        // Try to find complete JSON objects in the buffer
        let startIdx = 0;
        
        while (startIdx < buffer.length) {
          // Find the start of a JSON object
          const objStart = buffer.indexOf('{', startIdx);
          if (objStart === -1) break;
          
          // Try to find the matching closing brace
          let braceCount = 0;
          let inString = false;
          let escape = false;
          let objEnd = -1;
          
          for (let i = objStart; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escape) {
              escape = false;
              continue;
            }
            
            if (char === '\\') {
              escape = true;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  objEnd = i;
                  break;
                }
              }
            }
          }
          
          // If we found a complete object
          if (objEnd !== -1) {
            const jsonStr = buffer.substring(objStart, objEnd + 1);
            
            try {
              const json = JSON.parse(jsonStr);
              const textPart = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (textPart) {
                accumulatedText += textPart;
                if (onChunk) onChunk(textPart);
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse JSON object:', e.message);
            }
            
            // Move past this object
            startIdx = objEnd + 1;
          } else {
            // No complete object found, keep this part in buffer
            break;
          }
        }
        
        // Keep the unparsed portion in the buffer
        buffer = buffer.substring(startIdx);
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        // Try one more time to extract any remaining objects
        let idx = 0;
        while (idx < buffer.length) {
          const objStart = buffer.indexOf('{', idx);
          if (objStart === -1) break;
          
          let braceCount = 0;
          let inString = false;
          let escape = false;
          let objEnd = -1;
          
          for (let i = objStart; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escape) {
              escape = false;
              continue;
            }
            
            if (char === '\\') {
              escape = true;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  objEnd = i;
                  break;
                }
              }
            }
          }
          
          if (objEnd !== -1) {
            const jsonStr = buffer.substring(objStart, objEnd + 1);
            try {
              const json = JSON.parse(jsonStr);
              const textPart = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textPart) {
                accumulatedText += textPart;
                if (onChunk) onChunk(textPart);
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse final JSON:', e.message);
            }
            idx = objEnd + 1;
          } else {
            break;
          }
        }
      }

      if (!accumulatedText) {
        console.warn('⚠️ Gemini returned an empty response.');
      } else {
        console.log('✅ Stream complete. Total length:', accumulatedText.length);
      }

      if (onComplete) onComplete(accumulatedText);

      // Build updated conversation history
      const updatedHistory = [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: message }],
        },
        {
          role: "model",
          parts: [{ text: accumulatedText }],
        },
      ];

      return {
        message: accumulatedText,
        conversationHistory: updatedHistory,
      };
    } catch (streamError) {
      console.error('🔥 Stream error:', streamError);
      const errorMsg = '⚠️ Gemini streaming failed. Please check your network or API key.';
      if (onComplete) onComplete(errorMsg);
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