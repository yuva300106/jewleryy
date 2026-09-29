import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Minimize2,
  Maximize2,
  MapPin,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  ChatMessage,
  sendChatMessageToN8n,
  getOrCreateSessionId,
  resetSessionId,
  DEFAULT_N8N_WEBHOOK_URL,
} from '../services/chatService';
import { UserLocation } from '../types/store';

interface ChatbotProps {
  userLocation: UserLocation;
  onSearchQuery?: (query: string) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  sender: 'bot',
  text: "Hello! Welcome to **JewelFinder Assistant**. I'm here to help you find nearby jewelry stores, gold shops, diamond dealers, and custom craftsmen.\n\nTo get started, you can ask for recommendations, share your location, or explore one of the topics below!",
  timestamp: Date.now(),
};

const SUGGESTED_PROMPTS = [
  '📍 Find top jewelry stores near my location',
  '💎 Best diamond engagement ring specialists',
  '✨ 22K & 24K pure gold jewelers',
  '💍 Custom handmade wedding band designers',
  '🏷️ Luxury watch and jewelry boutiques',
];

export const Chatbot: React.FC<ChatbotProps> = ({
  userLocation,
  onSearchQuery,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    setInternalIsOpen(nextVal);
    onToggleOpen?.(nextVal);
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('jewelfinder_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
    return [INITIAL_WELCOME_MESSAGE];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasUnreadNotice, setHasUnreadNotice] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jewelfinder_chat_history', JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat history:', err);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnreadNotice(false);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    const sessionId = getOrCreateSessionId();

    try {
      const botResponseText = await sendChatMessageToN8n(query, sessionId);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Failed to communicate with n8n chatbot:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `Sorry, I encountered an issue contacting the assistant server: ${err.message || 'Please check your connection and try again.'}`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLocation = () => {
    if (userLocation.coords) {
      const locText = userLocation.locationName
        ? `${userLocation.locationName} (${userLocation.coords.lat.toFixed(4)}, ${userLocation.coords.lng.toFixed(4)})`
        : `GPS coordinates: ${userLocation.coords.lat.toFixed(4)}, ${userLocation.coords.lng.toFixed(4)}`;
      const query = `I am currently located at ${locText}. Can you suggest high-rated jewelry stores, gold shops, or diamond boutiques near me?`;
      handleSendMessage(query);
    } else {
      handleSendMessage('Find jewelry stores near my current location.');
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Do you want to clear your conversation history?')) {
      resetSessionId();
      setMessages([INITIAL_WELCOME_MESSAGE]);
      localStorage.removeItem('jewelfinder_chat_history');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format bot markdown text with bold, bullets, and links
  const renderFormattedMessage = (text: string) => {
    // Process lines
    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // List item
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const cleanLine = isBullet ? line.trim().replace(/^[-*]\s+/, '') : line;

          // Replace **bold** with strong
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-stone-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            // Check for url
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const subParts = part.split(urlRegex);
            return subParts.map((sub, sIdx) => {
              if (sub.match(urlRegex)) {
                return (
                  <a
                    key={sIdx}
                    href={sub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 underline hover:text-amber-900 break-all"
                  >
                    {sub}
                  </a>
                );
              }
              return sub;
            });
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-amber-600 font-bold">•</span>
                <div className="flex-1">{formattedLine}</div>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 animate-bounce-subtle">
          {hasUnreadNotice && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-stone-900 text-amber-200 border border-amber-500/40 text-xs shadow-xl cursor-pointer hover:bg-stone-850 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Ask Jewelry AI Assistant</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasUnreadNotice(false);
                }}
                className="text-stone-400 hover:text-white ml-1"
              >
                ×
              </button>
            </div>
          )}

          <button
            onClick={() => setIsOpen(true)}
            title="Open Jewelry AI Assistant"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-stone-950 shadow-2xl shadow-amber-600/40 hover:shadow-amber-500/60 transition-all transform hover:scale-105 active:scale-95 border-2 border-amber-200"
          >
            <div className="w-full h-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-stone-950 group-hover:rotate-12 transition-transform duration-300" />
            </div>

            {/* Glowing ring animation */}
            <span className="absolute -inset-1 rounded-full bg-amber-400/20 blur-sm group-hover:bg-amber-400/40 animate-pulse pointer-events-none" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-amber-900/20 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between border-b border-amber-900/30 flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-950/40">
                <div className="w-full h-full bg-stone-900 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-serif-luxury font-bold text-sm text-amber-100">
                    JewelFinder Concierge
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-stone-300 flex items-center space-x-1">
                  <span>AI Jewelry Advisor</span>
                  <span>•</span>
                  <span className="text-amber-300/80">n8n Connected</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-stone-300">
              <button
                onClick={handleClearChat}
                title="Clear chat history"
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-amber-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-amber-400 transition"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#faf8f5]">
                {/* Messages */}
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
                          isUser
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-900 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`relative max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs ${
                          isUser
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-tr-none'
                            : msg.isError
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                            : 'bg-white text-stone-800 border border-stone-200/90 rounded-tl-none'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        ) : (
                          renderFormattedMessage(msg.text)
                        )}

                        {/* Timestamp & Copy */}
                        <div
                          className={`flex items-center justify-between mt-1 text-[9px] ${
                            isUser ? 'text-amber-200/80' : 'text-stone-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {!isUser && (
                            <button
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              title="Copy response"
                              className="ml-2 hover:text-stone-700 transition"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading animation when waiting for n8n webhook */}
                {isLoading && (
                  <div className="flex items-start space-x-2">
                    <div className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-white border border-stone-200/90 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                          style={{ animationDelay: '0.15s' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                          style={{ animationDelay: '0.3s' }}
                        />
                        <span className="text-[11px] text-stone-400 ml-1.5 font-medium">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="px-3 py-1.5 bg-stone-100/90 border-t border-stone-200/60 overflow-x-auto no-scrollbar flex items-center space-x-1.5 flex-nowrap text-[11px]">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 transition shadow-xs flex-shrink-0 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-stone-200 flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-1.5"
                >
                  {/* Share Location Button */}
                  <button
                    type="button"
                    onClick={handleSendLocation}
                    disabled={isLoading}
                    title="Send my current location to assistant"
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition disabled:opacity-50 flex-shrink-0"
                  >
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about jewelry, diamonds, stores..."
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-3.5 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-stone-50/50"
                  />

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-xs transition active:scale-95 disabled:opacity-50 flex-shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 px-1">
                  <span>Powered by n8n Chat Webhook</span>
                  <span className="truncate max-w-[170px]" title={DEFAULT_N8N_WEBHOOK_URL}>
                    yuva7.app.n8n.cloud
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
