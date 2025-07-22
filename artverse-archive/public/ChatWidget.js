
(function() {
  'use strict';

  // Embedded SVG icons
  const icons = {
    messageCircle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    x: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>',
    send: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    loader: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
    externalLink: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="m10 14 9-9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    image: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
  };

  // CSS styles
  const styles = `
    .nft-chat-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    .nft-chat-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, hsl(154, 41%, 19%), hsl(154, 41%, 25%));
      color: hsl(0, 0%, 95%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px -6px hsla(154, 41%, 19%, 0.15);
      transition: all 0.3s ease;
      animation: gentle-float 4s ease-in-out infinite;
    }

    .nft-chat-button:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 32px -8px hsla(154, 41%, 19%, 0.2);
    }

    .nft-chat-button.open {
      transform: scale(0.9);
      box-shadow: 0 8px 32px -8px hsla(154, 41%, 19%, 0.2);
    }

    .nft-chat-window {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 320px;
      height: 384px;
      background: hsl(0, 0%, 100%);
      border: 1px solid hsl(0, 0%, 85%);
      border-radius: 12px;
      box-shadow: 0 8px 32px -8px hsla(154, 41%, 19%, 0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      backdrop-filter: blur(12px);
      animation: fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nft-chat-window.open {
      display: flex;
    }

    .nft-chat-header {
      background: linear-gradient(135deg, hsl(154, 41%, 19%), hsl(154, 41%, 25%));
      color: hsl(0, 0%, 95%);
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid hsla(0, 0%, 85%, 0.2);
    }

    .nft-chat-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: hsl(154, 41%, 25%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      margin-right: 12px;
    }

    .nft-chat-header-info h3 {
      font-weight: 600;
      font-size: 14px;
      margin: 0 0 2px 0;
    }

    .nft-chat-header-info p {
      font-size: 12px;
      opacity: 0.9;
      margin: 0;
    }

    .nft-chat-close {
      background: none;
      border: none;
      color: hsl(0, 0%, 95%);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .nft-chat-close:hover {
      background: hsla(255, 255%, 255%, 0.1);
    }

    .nft-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .nft-chat-message {
      display: flex;
      gap: 12px;
    }

    .nft-chat-message.user {
      justify-content: flex-end;
    }

    .nft-chat-message.user .nft-chat-bubble {
      background: hsl(0, 0%, 90%);
      color: hsl(0, 0%, 20%);
      margin-left: auto;
    }

    .nft-chat-message.ai {
      justify-content: flex-start;
    }

    .nft-chat-message.ai .nft-chat-bubble {
      background: hsl(154, 41%, 19%);
      color: hsl(0, 0%, 95%);
    }

    .nft-chat-bubble {
      max-width: 240px;
      padding: 12px;
      border-radius: 12px;
      box-shadow: 0 2px 12px -4px hsla(154, 41%, 19%, 0.15);
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .nft-chat-media {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nft-chat-media-item {
      border: 1px solid hsl(0, 0%, 85%);
      border-radius: 8px;
      overflow: hidden;
      background: hsl(0, 0%, 100%);
    }

    .nft-chat-media-image {
      position: relative;
    }

    .nft-chat-media-image img {
      width: 100%;
      height: 128px;
      object-fit: cover;
    }

    .nft-chat-media-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      background: hsla(0, 0%, 0%, 0.5);
      border-radius: 50%;
      padding: 4px;
      color: white;
    }

    .nft-chat-media-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s;
    }

    .nft-chat-media-link:hover {
      background: hsl(0, 0%, 97%);
    }

    .nft-chat-media-link-icon {
      color: hsl(154, 41%, 19%);
      flex-shrink: 0;
    }

    .nft-chat-media-link-info {
      flex: 1;
      min-width: 0;
    }

    .nft-chat-media-link-title {
      font-weight: 500;
      font-size: 14px;
      margin: 0 0 2px 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .nft-chat-media-link-desc {
      font-size: 12px;
      color: hsl(0, 0%, 45%);
      margin: 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .nft-chat-input-area {
      border-top: 1px solid hsl(0, 0%, 85%);
      padding: 12px;
      display: flex;
      gap: 8px;
    }

    .nft-chat-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid hsl(0, 0%, 85%);
      border-radius: 6px;
      background: hsl(0, 0%, 90%);
      font-size: 14px;
      outline: none;
    }

    .nft-chat-input:focus {
      border-color: hsl(154, 41%, 19%);
      background: hsl(0, 0%, 100%);
    }

    .nft-chat-send {
      background: hsl(154, 41%, 19%);
      color: hsl(0, 0%, 95%);
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nft-chat-send:hover {
      background: hsl(154, 41%, 15%);
    }

    .nft-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nft-chat-notification {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      background: hsl(0, 45%, 29%);
      border-radius: 50%;
      animation: subtle-pulse 3s ease-in-out infinite;
    }

    .nft-chat-loading {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nft-chat-loading svg {
      animation: spin 1s linear infinite;
    }

    @keyframes gentle-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-2px); }
    }

    @keyframes fade-in-up {
      0% { 
        transform: translateY(20px) scale(0.95); 
        opacity: 0; 
      }
      100% { 
        transform: translateY(0) scale(1); 
        opacity: 1; 
      }
    }

    @keyframes subtle-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .nft-chat-widget {
        bottom: 16px;
        right: 16px;
      }
      
      .nft-chat-window {
        width: calc(100vw - 32px);
        right: -280px;
      }
    }
  `;

  class NFTChatWidget {
    constructor() {
      this.isOpen = false;
      this.isLoading = false;
      this.messages = [
        {
          id: '1',
          content: "Hi! I'm Sharon AI, your NFT assistant. I have access to your database and can help you find information about NFTs currently available. What would you like to know?",
          type: 'ai',
          timestamp: new Date(),
        }
      ];
      this.webhookUrl = 'https://n8n-edafe.onrender.com/webhook/b1be177e-c4dc-4446-83fd-94b55215d553';
      
      this.init();
    }

    init() {
      this.injectStyles();
      this.createWidget();
      this.bindEvents();
    }

    injectStyles() {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    createWidget() {
      const widget = document.createElement('div');
      widget.className = 'nft-chat-widget';
      widget.innerHTML = `
        <div class="nft-chat-window" id="nft-chat-window">
          <div class="nft-chat-header">
            <div style="display: flex; align-items: center;">
              <div class="nft-chat-avatar">SA</div>
              <div class="nft-chat-header-info">
                <h3>Sharon AI</h3>
                <p>NFT Database Assistant</p>
              </div>
            </div>
            <button class="nft-chat-close" id="nft-chat-close">
              ${icons.x}
            </button>
          </div>
          <div class="nft-chat-messages" id="nft-chat-messages"></div>
          <div class="nft-chat-input-area">
            <input 
              type="text" 
              class="nft-chat-input" 
              id="nft-chat-input"
              placeholder="Ask about NFTs..."
            />
            <button class="nft-chat-send" id="nft-chat-send">
              ${icons.send}
            </button>
          </div>
        </div>
        <button class="nft-chat-button" id="nft-chat-button">
          ${icons.messageCircle}
          <div class="nft-chat-notification" id="nft-chat-notification"></div>
        </button>
      `;

      document.body.appendChild(widget);
      this.widget = widget;
      this.renderMessages();
    }

    bindEvents() {
      const button = document.getElementById('nft-chat-button');
      const closeBtn = document.getElementById('nft-chat-close');
      const input = document.getElementById('nft-chat-input');
      const sendBtn = document.getElementById('nft-chat-send');

      button.addEventListener('click', () => this.toggleWidget());
      closeBtn.addEventListener('click', () => this.closeWidget());
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    toggleWidget() {
      this.isOpen = !this.isOpen;
      const window = document.getElementById('nft-chat-window');
      const button = document.getElementById('nft-chat-button');
      const notification = document.getElementById('nft-chat-notification');

      if (this.isOpen) {
        window.classList.add('open');
        button.classList.add('open');
        button.innerHTML = icons.x;
        notification.style.display = 'none';
      } else {
        window.classList.remove('open');
        button.classList.remove('open');
        button.innerHTML = icons.messageCircle;
      }
    }

    closeWidget() {
      this.isOpen = false;
      const window = document.getElementById('nft-chat-window');
      const button = document.getElementById('nft-chat-button');

      window.classList.remove('open');
      button.classList.remove('open');
      button.innerHTML = icons.messageCircle;
    }

    async sendMessage() {
      const input = document.getElementById('nft-chat-input');
      const message = input.value.trim();

      if (!message || this.isLoading) return;

      const userMessage = {
        id: Date.now().toString(),
        content: message,
        type: 'user',
        timestamp: new Date(),
      };

      this.messages.push(userMessage);
      input.value = '';
      this.isLoading = true;
      this.renderMessages();

      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            timestamp: new Date().toISOString(),
            sessionId: 'nft-chat-widget-session'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const aiResponse = await response.json();
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.message || aiResponse.text || 'I received your message but couldn\'t process it properly.',
          type: 'ai',
          timestamp: new Date(),
          media: aiResponse.media || []
        };

        this.messages.push(aiMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          type: 'ai',
          timestamp: new Date(),
        };
        this.messages.push(errorMessage);
      } finally {
        this.isLoading = false;
        this.renderMessages();
      }
    }

    renderMessages() {
      const container = document.getElementById('nft-chat-messages');
      
      let html = '';
      
      this.messages.forEach(message => {
        html += `
          <div class="nft-chat-message ${message.type}">
            ${message.type === 'ai' ? '<div class="nft-chat-avatar">SA</div>' : ''}
            <div class="nft-chat-bubble">
              ${message.content}
              ${this.renderMedia(message.media || [])}
            </div>
          </div>
        `;
      });

      if (this.isLoading) {
        html += `
          <div class="nft-chat-message ai">
            <div class="nft-chat-avatar">SA</div>
            <div class="nft-chat-bubble">
              <div class="nft-chat-loading">
                ${icons.loader}
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
      container.scrollTop = container.scrollHeight;
    }

    renderMedia(media) {
      if (!media || media.length === 0) return '';

      let html = '<div class="nft-chat-media">';
      
      media.forEach(item => {
        if (item.type === 'image') {
          html += `
            <div class="nft-chat-media-item">
              <div class="nft-chat-media-image">
                <img src="${item.url}" alt="${item.title || 'NFT Image'}" />
                <div class="nft-chat-media-icon">
                  ${icons.image}
                </div>
              </div>
            </div>
          `;
        } else if (item.type === 'link') {
          html += `
            <div class="nft-chat-media-item">
              <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="nft-chat-media-link">
                <div class="nft-chat-media-link-icon">
                  ${icons.externalLink}
                </div>
                <div class="nft-chat-media-link-info">
                  <p class="nft-chat-media-link-title">${item.title || 'View NFT'}</p>
                  ${item.description ? `<p class="nft-chat-media-link-desc">${item.description}</p>` : ''}
                </div>
              </a>
            </div>
          `;
        }
      });
      
      html += '</div>';
      return html;
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.NFTChatWidget = new NFTChatWidget();
    });
  } else {
    window.NFTChatWidget = new NFTChatWidget();
  }

  // Expose for manual initialization
  window.initNFTChatWidget = () => {
    if (!window.NFTChatWidget) {
      window.NFTChatWidget = new NFTChatWidget();
    }
  };

})();
