"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, Smile, Image, Send } from "lucide-react";
import { motion } from "framer-motion";
import EmojiPicker from "emoji-picker-react";

const Chats = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [partnerName, setPartnerName] = useState("Select a user to chat");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com";
    const newSocket = io(socketUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected for chats");
      setError(null);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to server. Retrying...");
    });

    newSocket.on("message", ({ text, from, messageType }) => {
      if (selectedPartner && from === selectedPartner.userId) {
        setChat((prev) => [
          ...prev,
          { from: "stranger", text, messageType, createdAt: new Date(), reactions: [] },
        ]);
      }
    });

    newSocket.on("reaction", ({ messageId, emoji, from }) => {
      if (selectedPartner && from === selectedPartner.userId) {
        setChat((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, reactions: [...msg.reactions, { userId: from, emoji }] }
              : msg
          )
        );
      }
    });

    newSocket.on("typing", ({ from }) => {
      if (selectedPartner && from === selectedPartner.userId) {
        setIsPartnerTyping(true);
      }
    });

    newSocket.on("stop_typing", ({ from }) => {
      if (selectedPartner && from === selectedPartner.userId) {
        setIsPartnerTyping(false);
      }
    });

    newSocket.on("continue_chat", ({ partnerUserId, partnerName, partnerAvatar }) => {
      const newPartner = {
        userId: partnerUserId,
        partnerName,
        partnerAvatar,
        createdAt: new Date(),
      };
      setPartners((prev) => {
        if (!prev.some((p) => p.userId === partnerUserId)) {
          return [...prev, newPartner];
        }
        return prev;
      });
      setSelectedPartner(newPartner);
      setPartnerName(partnerName);
      router.push(
        `/chats?partnerId=${partnerUserId}&partnerName=${encodeURIComponent(partnerName)}`,
        { scroll: false }
      );
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setError("Disconnected from server. Attempting to reconnect...");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("Socket disconnected due to cleanup");
    };
  }, [selectedPartner]);

  // Fetch chat partners and handle query parameters
  useEffect(() => {
    const fetchChatPartners = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com"}/user/chat-partners`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chat partners");
        }

        const data = await response.json();
        setPartners(data);
        setLoading(false);

        const partnerId = searchParams.get("partnerId");
        const partnerName = searchParams.get("partnerName");
        if (partnerId && partnerName) {
          const decodedPartnerName = decodeURIComponent(partnerName);
          const partner = data.find((p) => p.userId === partnerId);
          if (partner) {
            setSelectedPartner(partner);
            setPartnerName(partner.partnerName);
          } else {
            const newPartner = { userId: partnerId, partnerName: decodedPartnerName, createdAt: new Date() };
            setPartners((prev) => [...prev, newPartner]);
            setSelectedPartner(newPartner);
            setPartnerName(decodedPartnerName);

            try {
              await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com"}/user/add-chat-partner`,
                {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ partnerId }),
                }
              );
            } catch (err) {
              console.error("Error adding chat partner:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching chat partners:", err);
        setError("Failed to load chats");
        setLoading(false);
      }
    };

    fetchChatPartners();
  }, [searchParams]);

  // Fetch chat messages when a partner is selected
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!selectedPartner) {
        setChat([]);
        setIsPartnerTyping(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com"
          }/user/chat-messages/${selectedPartner.userId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chat messages");
        }

        const messages = await response.json();
        setChat(messages);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chat messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    };

    fetchChatMessages();
  }, [selectedPartner]);

  // Fetch GIFs when GIF picker is opened or query changes
  useEffect(() => {
    if (!showGifPicker || !gifQuery) {
      setGifs([]);
      return;
    }

    const fetchGifs = async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com"
          }/gifs/search?query=${encodeURIComponent(gifQuery)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch GIFs");
        }

        const data = await response.json();
        setGifs(data);
      } catch (err) {
        console.error("Error fetching GIFs:", err);
        setError("Failed to load GIFs");
      }
    };

    const debounce = setTimeout(fetchGifs, 500);
    return () => clearTimeout(debounce);
  }, [gifQuery, showGifPicker]);

  // Auto-scroll chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat, isPartnerTyping]);

  // Handle typing detection
  useEffect(() => {
    if (!socket || !selectedPartner) return;

    if (message.trim()) {
      socket.emit("typing", { toUserId: selectedPartner.userId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { toUserId: selectedPartner.userId });
      }, 3000);
    } else {
      socket.emit("stop_typing", { toUserId: selectedPartner.userId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, socket, selectedPartner]);

  const sendMessage = async () => {
    if (socket && message.trim() && selectedPartner) {
      try {
        const newMessage = { from: "me", text: message, messageType: "text", createdAt: new Date(), reactions: [] };
        setChat((prev) => [...prev, newMessage]);
        setMessage("");
        setShowEmojiPicker(false);
        setShowGifPicker(false);
        socket.emit("message", { text: message, toUserId: selectedPartner.userId, messageType: "text" });
        socket.emit("stop_typing", { toUserId: selectedPartner.userId });
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message");
      }
    }
  };

  const handleEmojiSelect = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const handleGifSelect = (gifUrl) => {
    const newMessage = { from: "me", text: gifUrl, messageType: "gif", createdAt: new Date(), reactions: [] };
    setChat((prev) => [...prev, newMessage]);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    socket.emit("message", { text: gifUrl, toUserId: selectedPartner.userId, messageType: "gif" });
    socket.emit("stop_typing", { toUserId: selectedPartner.userId });
  };

  const handlePartnerSelect = (partner) => {
    setSelectedPartner(partner);
    setPartnerName(partner.partnerName);
    setChat([]);
    setIsPartnerTyping(false);
    setLoading(true);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    router.push(
      `/chats?partnerId=${partner.userId}&partnerName=${encodeURIComponent(partner.partnerName)}`,
      { scroll: false }
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-3rem)] gap-6">
        {/* Sidebar: Chat Partners */}
        <motion.div
          initial={{ width: "33.333%" }}
          animate={{ width: isSidebarOpen ? "33.333%" : 40 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <div className="h-full flex flex-col">
            <Button
              onClick={toggleSidebar}
              className="w-full border-2 border-black rounded-none bg-gray-200 text-black hover:bg-gray-300 shadow-[2px_2px_0_0_#000] mb-1"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {isSidebarOpen && (
              <div className="flex-1 border-4 border-black shadow-[8px_8px_0_0_#000] bg-yellow-200 p-4 rounded-none">
                <h2 className="text-2xl font-extrabold text-black border-b-4 border-black pb-4 mb-4">Your Matches</h2>
                <div className="overflow-y-auto h-[calc(100%-5rem)]">
                  {loading && <p className="text-gray-800">Loading...</p>}
                  {error && <p className="text-red-600 text-black font-bold">{error}</p>}
                  {!loading && !error && partners.length === 0 && (
                    <p className="text-gray-800">No active chats found.</p>
                  )}
                  {!loading && !error && partners.length > 0 && (
                    <div className="space-y-2">
                      {partners.map((partner, index) => (
                        <div
                          key={index}
                          onClick={() => handlePartnerSelect(partner)}
                          className={`p-4 rounded-none border-2 border-black rounded-sm cursor-pointer transition-transform duration-200 transform hover:bg-gray-300 hover:shadow-[4px_4px_0_0_#000] ${
                            selectedPartner?.userId === partner.userId
                              ? "bg-pink-300 text-black shadow-[4px_4px_0_0_#000]"
                              : "bg-white text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center overflow-hidden mr-3">
                              {partner.partnerAvatar ? (
                                <img
                                  src={partner.partnerAvatar}
                                  alt={`${partner.partnerName} Profile picture`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/default-avatar.png";
                                  }}
                                />
                              ) : (
                                <img
                                  src="/default-avatar.png"
                                  alt="Default profile picture"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <p className="font-bold text-lg">{partner.partnerName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-4 border-black shadow-[8px_8px_0_#000] bg-white rounded-none">
          <div className="p-4 border-b-4 border-black">
            <h1 className="text-3xl font-bold text-black">Chat with {partnerName}</h1>
            <div
              className={`mt-2 p-3 rounded-none border-2 border-black ${
                error ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              <p className="font-semibold">
                {error
                  ? error
                  : selectedPartner
                  ? "Connected to your partner"
                  : "Select a partner to chat with"}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto" ref={chatContainerRef}>
            {loading && <p className="text-gray-600">Loading messages...</p>}
            {!loading && selectedPartner && chat.length === 0 && (
              <p className="text-gray-600 text-center">No messages yet. Say hi!</p>
            )}
            {!loading && selectedPartner && chat.length > 0 && (
              chat.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`mb-4 p-3 rounded-none border-2 border-black max-w-[70%] ${
                    msg.from === "me"
                      ? "ml-auto bg-blue-300 shadow-[4px_4px_0_0_#000]"
                      : "mr-auto bg-white shadow-[4px_4px_0_0_#000]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-lg">{msg.from === "me" ? "You" : partnerName}:</strong>
                    <span className="ml-2 text-xs text-gray-600">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                  {msg.messageType === "gif" ? (
                    <img src={msg.text} alt="GIF" className="mt-1 max-w-full h-auto" />
                  ) : (
                    <p className="mt-1 text-lg">{msg.text}</p>
                  )}
                  {msg.reactions.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {msg.reactions.map((reaction, rIdx) => (
                        <span key={rIdx} className="text-sm">
                          {reaction.emoji} ({reaction.userId === "me" ? "You" : partnerName})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {isPartnerTyping && selectedPartner && (
              <div className="mb-4 p-3 rounded-none border-2 border-black max-w-[70%] mr-auto bg-gray-100 shadow-[4px_4px_0_0_#000]">
                <p className="text-gray-600 text-sm animate-pulse" aria-live="polite">
                  {partnerName} is typing...
                </p>
              </div>
            )}
            {!selectedPartner && (
              <p className="text-gray-600 text-center">Select a partner to view messages</p>
            )}
          </div>

          {selectedPartner && (
            <div className="p-4 border-t-4 border-t bg-white sticky bottom-0">
              {showEmojiPicker && (
                <div className="mb-2">
                  <EmojiPicker onEmojiClick={handleEmojiSelect} width="100%" height={300} />
                </div>
              )}
              {showGifPicker && (
                <div className="mb-2 p-4 border-2 border-black bg-white shadow-[4px_4px_0_0_#000]">
                  <input
                    type="text"
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    placeholder="Search for GIFs..."
                    className="w-full px-4 py-2 border-2 border-black rounded-none focus:ring-0 focus:border-blue-500 bg-white text-black placeholder-gray-400 mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {gifs.map((gif) => (
                      <img
                        key={gif.id}
                        src={gif.url}
                        alt={gif.title}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => handleGifSelect(gif.url)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowGifPicker(false);
                  }}
                  className="p-2 border-2 border-black rounded-none bg-blue-300 text-black hover:bg-blue-400 shadow-[4px_4px_0_0_#000]"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    setShowEmojiPicker(false);
                    setGifQuery("");
                  }}
                  className="p-2 border-2 border-black rounded-none bg-blue-300 text-black hover:bg-blue-500 shadow-[4px_4px_0_0_#000]"
                >
                  <Image className="h-5 w-5" />
                </Button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border-2 border-black rounded-none focus:ring-0 focus:border-blue-500 bg-white text-black placeholder-gray-400"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!message.trim() || loading}
                  className={`px-4 py-2 border-2 border-black rounded-none bg-blue-600 text-white hover:bg-blue-700 shadow-[4px_4px_0_0_#000] transition-transform duration-200 ${
                    !message.trim() || loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                  }`}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;