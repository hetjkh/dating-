
"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [status, setStatus] = useState("Click Start to begin");
  const [sessionId, setSessionId] = useState(null);
  const [partnerUserId, setPartnerUserId] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genderPreference, setGenderPreference] = useState("both");
  const [userGender, setUserGender] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const localStreamRef = useRef(null);
  const currentSessionIdRef = useRef(null);
  const timerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const router = useRouter();

  // Fetch user profile to get gender
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com"}/user/profile`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const profile = await response.json();
        if (profile.yourGender) {
          setUserGender(profile.yourGender);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setStatus("Failed to load profile data");
      }
    };

    fetchProfile();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  // Socket connection and event handlers
  useEffect(() => {
    if (!isStarted) return;

    setStatus("Initializing connection...");

    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com";
    const newSocket = io(socketUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: { genderPreference },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setStatus("Looking for a compatible stranger...");
      setLoading(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message, err.stack);
      setStatus("Failed to connect to server. Retrying...");
      setLoading(false);
    });

    newSocket.on("error", (err) => {
      console.error("Socket error:", err.message, err.stack);
      if (err.message === "Profile incomplete. Please complete your profile to chat.") {
        setStatus("Please complete your profile to start chatting.");
        setIsStarted(false);
        router.push("/profile");
      } else if (err.message === "Invalid gender preference") {
        setStatus("Invalid gender preference selected. Please choose a valid option.");
        setIsStarted(false);
      } else {
        setStatus("Connection error. Please try again.");
        setIsStarted(false);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setStatus("Disconnected - trying to reconnect...");
      cleanupVideoCall();
      clearTimer();
      setShowContinuePrompt(false);
      setPartnerUserId(null);
      currentSessionIdRef.current = null;
    });

    newSocket.on("waiting", ({ message }) => {
      console.log("Waiting:", message);
      setStatus(message);
      setChat([]);
      setSessionId(null);
      setPartnerUserId(null);
      currentSessionIdRef.current = null;
      cleanupVideoCall();
      clearTimer();
      setShowContinuePrompt(false);
    });

    newSocket.on("paired", async ({ message, sessionId: newSessionId }) => {
      console.log("Paired with new session:", newSessionId);
      await cleanupVideoCall();
      setSessionId(newSessionId);
      currentSessionIdRef.current = newSessionId;
      setStatus("Connecting video...");
      setChat([]);
      setTimeLeft(120);
      startTimer();
      setShowContinuePrompt(false);

      await ensureLocalStream();

      setTimeout(() => {
        startVideoCall(newSocket, newSessionId);
      }, 1000);
    });

    newSocket.on("message", ({ text, from }) => {
      setChat((prev) => [...prev, { from: "stranger", text, createdAt: new Date() }]);
    });

    newSocket.on("partner_left", ({ message }) => {
      console.log("Partner left");
      setStatus("Partner disconnected - finding new match...");
      setChat([]);
      setSessionId(null);
      setPartnerUserId(null);
      currentSessionIdRef.current = null;
      cleanupVideoCall();
      clearTimer();
      setShowContinuePrompt(false);
    });

    newSocket.on("session_timeout_prompt", ({ message }) => {
      console.log("Session timeout prompt:", message);
      setStatus(message);
      setShowContinuePrompt(true);
      clearTimer();
    });

    newSocket.on("session_timeout", ({ message }) => {
      console.log("Session timed out");
      setStatus("Session timed out - finding new match...");
      setChat([]);
      setSessionId(null);
      setPartnerUserId(null);
      currentSessionIdRef.current = null;
      cleanupVideoCall();
      clearTimer();
      setShowContinuePrompt(false);
      newSocket.emit("next");
    });

    newSocket.on("continue_chat", async ({ message, partnerUserId, partnerName }) => {
      console.log("Both users agreed to continue, redirecting to messaging:", partnerUserId);
      setShowContinuePrompt(false);
      setPartnerUserId(partnerUserId);
      cleanupVideoCall();
      clearTimer();
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://dating-backend-1h4q.onrender.com"}/user/add-chat-partner`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partnerId: partnerUserId }),
          }
        );
      } catch (err) {
        console.error("Error adding chat partner:", err);
      }
      router.push(`/chats?partnerId=${partnerUserId}&partnerName=${encodeURIComponent(partnerName)}`);
    });

    newSocket.on("offer", async ({ offer, sessionId: offerSessionId }) => {
      console.log("Received offer for session:", offerSessionId);
      if (offerSessionId !== currentSessionIdRef.current) {
        console.warn("Ignoring offer for wrong session");
        return;
      }

      try {
        await cleanupVideoCall();
        await ensureLocalStream();

        const pc = createPeerConnection(newSocket, offerSessionId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit("answer", { answer, sessionId: offerSessionId });
        processQueuedIceCandidates();
      } catch (error) {
        console.error("Error handling offer:", error);
        setStatus("Video connection failed - try next match");
      }
    });

    newSocket.on("answer", async ({ answer, sessionId: answerSessionId }) => {
      console.log("Received answer for session:", answerSessionId);
      if (!peerConnectionRef.current || answerSessionId !== currentSessionIdRef.current) {
        console.warn("Ignoring answer - wrong session or no connection");
        return;
      }

      try {
        if (peerConnectionRef.current.signalingState === "have-local-offer") {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          processQueuedIceCandidates();
        } else {
          console.warn("Peer connection in wrong state:", peerConnectionRef.current.signalingState);
        }
      } catch (error) {
        console.error("Error handling answer:", error);
        setStatus("Video connection failed - try next match");
      }
    });

    newSocket.on("ice-candidate", async ({ candidate, sessionId: candidateSessionId }) => {
      if (candidateSessionId !== currentSessionIdRef.current) {
        return;
      }

      if (candidate && peerConnectionRef.current) {
        try {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            iceCandidatesQueueRef.current.push(candidate);
          }
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    setSocket(newSocket);

    return () => {
      cleanupVideoCall();
      clearTimer();
      newSocket.disconnect();
      console.log("Socket disconnected due to cleanup");
    };
  }, [isStarted, genderPreference, router]);

  const ensureLocalStream = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(console.error);
        }
      } catch (error) {
        console.error("Error getting local stream:", error);
        setStatus("Camera access failed - please check permissions");
        throw error;
      }
    }
  };

  const createPeerConnection = (socket, sessionId) => {
    console.log("Creating new peer connection");
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, sessionId });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          setStatus("Connected");
          break;
        case "disconnected":
          setStatus("Connection interrupted - trying to reconnect...");
          break;
        case "failed":
          setStatus("Connection failed - click Next to try again");
          break;
        case "closed":
          setStatus("Disconnected");
          break;
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track");
      if (remoteVideoRef.current && event.streams[0]) {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch((e) => {
            console.error("Error playing remote video:", e);
            setTimeout(() => {
              remoteVideoRef.current?.play().catch(console.error);
            }, 1000);
          });
        }
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const processQueuedIceCandidates = () => {
    if (peerConnectionRef.current?.remoteDescription) {
      iceCandidatesQueueRef.current.forEach((candidate) => {
        peerConnectionRef.current.addIceCandidate(candidate).catch((error) =>
          console.error("Error processing queued candidate:", error)
        );
      });
      iceCandidatesQueueRef.current = [];
    }
  };

  const startVideoCall = async (socket, sessionId) => {
    console.log("Starting video call for session:", sessionId);
    try {
      await ensureLocalStream();
      const pc = createPeerConnection(socket, sessionId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, sessionId });
    } catch (error) {
      console.error("Error starting video call:", error);
      setStatus("Failed to start video - please refresh");
    }
  };

  const cleanupVideoCall = async () => {
    console.log("Cleaning up video call");

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      const stream = remoteVideoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      remoteVideoRef.current.srcObject = null;
    }

    iceCandidatesQueueRef.current = [];
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(120);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleStart = async () => {
    try {
      setStatus("Starting camera...");
      setLoading(true);
      await ensureLocalStream();
      setIsStarted(true);
      setLoading(false);
    } catch (error) {
      console.error("Failed to start:", error);
      setStatus("Failed to start - please check camera permissions");
      setLoading(false);
    }
  };

  const nextChat = async () => {
    if (!socket || !isStarted) return;

    console.log("Requesting next chat");
    setStatus("Looking for a compatible stranger...");
    setLoading(true);
    await cleanupVideoCall();
    setSessionId(null);
    setPartnerUserId(null);
    currentSessionIdRef.current = null;
    setChat([]);
    clearTimer();
    setShowContinuePrompt(false);

    try {
      await ensureLocalStream();
      socket.emit("next");
      setLoading(false);
    } catch (error) {
      console.error("Failed to prepare for next chat:", error);
      setStatus("Failed to access camera - please refresh");
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (socket && message && sessionId && partnerUserId) {
      try {
        setLoading(true);
        const newMessage = { from: "me", text: message, createdAt: new Date() };
        setChat((prev) => [...prev, newMessage]);
        socket.emit("message", { text: message, toUserId: partnerUserId });
        setMessage("");
        setLoading(false);
      } catch (error) {
        console.error("Error sending message:", error);
        setStatus("Failed to send message");
        setLoading(false);
      }
    }
  };

  const handleContinueResponse = (continueChat) => {
    if (socket && sessionId) {
      socket.emit("continue_response", { sessionId, continueChat });
      setShowContinuePrompt(false);
      setStatus("Waiting for other user's response...");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4 font-sans flex items-center justify-center">
      <div className="w-full max-w-6xl h-[calc(100vh-2rem)] flex gap-3">
        {/* Sidebar */}
        <motion.div
          initial={{ width: 256 }}
          animate={{ width: isSidebarOpen ? 256 : 40 }}
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
              <Card className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-white flex-1">
                <CardHeader className="border-b-2 border-black py-2">
                  <CardTitle className="text-lg font-extrabold text-black">Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div>
                    <Label htmlFor="genderPreference" className="block text-sm font-bold text-black mb-1">
                      Gender Preference
                    </Label>
                    <Select value={genderPreference} onValueChange={setGenderPreference}>
                      <SelectTrigger className="border-2 border-black rounded-none focus:ring-0 focus:border-pink-500 bg-white text-black text-sm">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black rounded-none bg-white">
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-black">Your Gender</p>
                    <p className="px-3 py-1 bg-gray-100 border-2 border-black rounded-none text-black text-sm">
                      {userGender || "Loading..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Header and Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-yellow-200">
              <CardHeader className="border-b-2 border-black flex items-center justify-between py-2">
                <CardTitle className="text-3xl font-extrabold text-black flex items-center gap-2 bg-pink-300 px-3 py-1 border-2 border-black shadow-[4px_4px_0_0_#000] animate-pulse">
                  <Heart className="h-8 w-8 text-red-500" />
                  Let's Ignite
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`p-2 rounded-none border-2 border-black text-sm flex items-center justify-between ${
                    status.includes("Connected")
                      ? "bg-green-200 text-green-800"
                      : status.includes("failed") || status.includes("Failed")
                      ? "bg-red-200 text-red-800"
                      : status.includes("Looking")
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-blue-200 text-blue-800"
                  }`}
                >
                  <p className="font-semibold">{status}</p>
                  {loading && <p className="ml-2 text-xs">Loading...</p>}
                  {sessionId && status.includes("Connected") && (
                    <motion.div
                      animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
                      transition={timeLeft <= 10 ? { repeat: Infinity, duration: 0.5 } : {}}
                      className="text-sm font-bold text-white bg-red-500 border-2 border-black px-3 py-1 rounded-none shadow-[2px_2px_0_0_#000]"
                    >
                      Time: {formatTime(timeLeft)}
                    </motion.div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Video Feeds */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white">
              <CardHeader className="border-b-2 border-black py-2">
                <p className="font-bold text-lg text-black">Your Camera</p>
              </CardHeader>
              <CardContent className="p-3">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-72 bg-black rounded-none object-cover"
                />
              </CardContent>
            </Card>
            <Card className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white">
              <CardHeader className="border-b-2 border-black py-2">
                <p className="font-bold text-lg text-black">Stranger's Camera</p>
              </CardHeader>
              <CardContent className="p-3">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-72 bg-black rounded-none object-cover"
                />
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col border-2 border-black shadow-[4px_4px_0_0_#000] bg-white">
            <CardHeader className="border-b-2 border-black py-2">
              <CardTitle className="text-lg font-extrabold text-black">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-3">
              <ScrollArea className="flex-1 pr-3 h-28" ref={chatContainerRef}>
                {loading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-600 text-center text-sm"
                  >
                    Loading messages...
                  </motion.p>
                )}
                {!loading && chat.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-600 text-center text-sm"
                  >
                    No messages yet
                  </motion.p>
                )}
                <AnimatePresence>
                  {!loading &&
                    chat.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-3 p-2 rounded-none border-2 border-black max-w-[70%] text-sm ${
                          msg.from === "me"
                            ? "ml-auto bg-pink-300 shadow-[2px_2px_0_0_#000]"
                            : "mr-auto bg-white shadow-[2px_2px_0_0_#000]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <strong>{msg.from === "me" ? "You" : "Stranger"}:</strong>
                          <span className="text-xs text-gray-600 ml-2">
                            {formatTimestamp(msg.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1">{msg.text}</p>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </ScrollArea>
              {isStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 p-3 border-t-2 border-black bg-white flex gap-2 flex-wrap"
                >
                  <Input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    placeholder="Type a message..."
                    className="flex-1 min-w-[200px] border-2 border-black rounded-none focus:ring-0 focus:border-pink-500 bg-white text-black placeholder-gray-400 text-sm"
                    disabled={loading || !partnerUserId}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim() || loading || !partnerUserId}
                    className={`border-2 border-black rounded-none bg-purple-500 text-white hover:bg-purple-600 shadow-[2px_2px_0_0_#000] text-sm px-3 transition-transform duration-200 ${
                      !message.trim() || loading || !partnerUserId ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                    }`}
                  >
                    Send
                  </Button>
                  <Button
                    onClick={nextChat}
                    disabled={loading}
                    className={`border-2 border-black rounded-none bg-green-500 text-white hover:bg-green-600 shadow-[2px_2px_0_0_#000] text-sm px-3 transition-transform duration-200 ${
                      loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                    }`}
                  >
                    Next
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Start Button */}
          {!isStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Button
                onClick={handleStart}
                disabled={loading}
                className={`w-full border-2 border-black rounded-none bg-pink-500 text-white hover:bg-pink-600 shadow-[4px_4px_0_0_#000] transition-transform duration-200 text-sm py-2 ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                }`}
              >
                {loading ? "Starting..." : "Start Chat"}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Continue Prompt Popup */}
        <AnimatePresence>
          {showContinuePrompt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <Card className="bg-yellow-200 border-2 border-black shadow-[4px_4px_0_0_#000] max-w-sm">
                <CardHeader className="border-b-2 border-black py-2">
                  <CardTitle className="text-lg font-extrabold text-black">Time's Up!</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="mb-3 text-black font-bold text-sm">Your 2-minute chat is over. Would you like to continue chatting?</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleContinueResponse(true)}
                      className="flex-1 border-2 border-black rounded-none bg-green-500 text-white hover:bg-green-600 shadow-[2px_2px_0_0_#000] text-sm transition-transform duration-200 hover:scale-105"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => handleContinueResponse(false)}
                      className="flex-1 border-2 border-black rounded-none bg-red-500 text-white hover:bg-red-600 shadow-[2px_2px_0_0_#000] text-sm transition-transform duration-200 hover:scale-105"
                    >
                      No
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <main>
      <Chat />
    </main>
  );
}
