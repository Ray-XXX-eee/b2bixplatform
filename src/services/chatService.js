class ChatService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  getProxyUrl(url) {
    if (url.includes('us.customer.ixhello.com')) {
      return url.replace('https://us.customer.ixhello.com', '/chatbot-api');
    }
    return url.replace('https://us.api.customer.ixhello.com', '/api');
  }

  generateSessionId(assistantId) {
    const randomGuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return `${assistantId}_${randomGuid}`;
  }

  async getAccessToken(authUrl, credentials) {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const params = new URLSearchParams(credentials);
      const proxyUrl = this.getProxyUrl(authUrl);

      const response = await fetch(`${proxyUrl}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async sendMessage(chatUrl, authUrl, credentials, assistantId, message, sessionId = '') {
    try {
      const token = await this.getAccessToken(authUrl, credentials);

      const proxyUrl = this.getProxyUrl(chatUrl);

      const finalSessionId = sessionId || this.generateSessionId(assistantId);

      const requestBody = {
        session_id: finalSessionId,
        message: message,
      };

      console.log('📤 Sending chat request:', {
        url: proxyUrl,
        headers: {
          'Content-Type': 'application/json',
          access_token: token.substring(0, 20) + '...',
        },
        body: requestBody,
      });

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: token,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Chat response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Chat API error:', errorData);
        throw new Error(`Chat request failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('✅ Chat response:', data);

      const responseData = data.data || data;
      const sessionIdFromResponse = responseData.sessionId || responseData.session_id || finalSessionId;
      const messageText = responseData.chatResponsePlainText || responseData.chatResponseHtml || responseData.message || data.message;

      return {
        session_id: sessionIdFromResponse,
        message: messageText,
        rawData: data,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendMeetingMessage(chatUrl, skillPublishingId, clientId, message, sessionId = '') {
    try {
      const proxyUrl = this.getProxyUrl(chatUrl);

      const finalSessionId = sessionId || this.generateSessionId(skillPublishingId);

      const requestBody = {
        skillPublishingId: skillPublishingId,
        ClientId: clientId,
        ClientSessionId: finalSessionId,
        localtime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        message: message,
      };

      console.log('📤 Sending meeting chat request:', {
        url: proxyUrl,
        body: requestBody,
      });

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Meeting chat response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Meeting chat API error:', errorData);
        throw new Error(`Meeting chat request failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('✅ Meeting chat response:', data);

      const messageText = data.response || data.message || data.text || 'I received your message but could not generate a response.';

      return {
        session_id: finalSessionId,
        message: messageText,
        rawData: data,
      };
    } catch (error) {
      console.error('Error sending meeting message:', error);
      throw error;
    }
  }

  clearToken() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}

const chatService = new ChatService();

export default chatService;
