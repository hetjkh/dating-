import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Video, VideoOff, UserPlus, Send } from "lucide-react";
import io from "socket.io-client";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [status, setStatus] = useState("Click Start to begin");
  const [sessionId, setSessionId] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const localStreamRef = useRef(null);
  const currentSessionIdRef = useRef(null);
  const connectionAttemptRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  // Only initialize socket when user explicitly starts the chat
  const initializeSocket = () => {
    if (socket) return socket; // Return existing socket if already created

    const newSocket = io("https://dating-backend-1h4q.onrender.com", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      if (connectionAttemptRef.current === 0) {
        setTimeout(() => {
          newSocket.emit("next");
          connectionAttemptRef.current++;
        }, 1000);
      }
      setStatus("Looking for a stranger...");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setStatus("Disconnected - trying to reconnect...");
      cleanupVideoCall();
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setStatus("Connection failed - please try again");
      cleanupVideoCall();
    });

    newSocket.on("waiting", ({ message }) => {
      console.log("Waiting:", message);
      setStatus(message);
      setChat([]);
      setSessionId(null);
      currentSessionIdRef.current = null;
      cleanupVideoCall();
    });

    newSocket.on("paired", async ({ message, sessionId: newSessionId }) => {
      console.log("Paired with new session:", newSessionId);
      await cleanupVideoCall();
      setSessionId(newSessionId);
      currentSessionIdRef.current = newSessionId;
      setStatus("Connecting video...");
      setChat([]);
      
      try {
        await ensureLocalStream();
        
        // Increased delay for more reliable connection establishment
        setTimeout(() => {
          if (currentSessionIdRef.current === newSessionId) {
            startVideoCall(newSocket, newSessionId);
          }
        }, 2000);
      } catch (error) {
        console.error("Failed to start video after pairing:", error);
        setStatus("Failed to access camera - please check permissions");
      }
    });

    newSocket.on("message", ({ text, from }) => {
      setChat(prev => [...prev, { from: "stranger", text }]);
    });

    newSocket.on("partner_left", ({ message }) => {
      console.log("Partner left");
      setStatus("Partner disconnected - finding new match...");
      setChat([]);
      setSessionId(null);
      currentSessionIdRef.current = null;
      cleanupVideoCall();
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
        
        // Set remote description first
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Create and set local description
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(answer);
        
        // Send answer to peer
        newSocket.emit("answer", { answer, sessionId: offerSessionId });
        
        // Process any queued candidates
        processQueuedIceCandidates();
        
        // Set a timeout to check connection status
        retryTimeoutRef.current = setTimeout(() => {
          if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
            console.log("Connection failed, retrying...");
            cleanupVideoCall();
            startVideoCall(newSocket, offerSessionId);
          }
        }, 10000);
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
          
          // Set a timeout to check connection status
          retryTimeoutRef.current = setTimeout(() => {
            if (peerConnectionRef.current?.iceConnectionState === "failed" || 
                peerConnectionRef.current?.iceConnectionState === "disconnected") {
              console.log("Connection failed after answer, retrying...");
              cleanupVideoCall();
              startVideoCall(newSocket, answerSessionId);
            }
          }, 10000);
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
    return newSocket;
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
      cleanupVideoCall();
      stopLocalStream();
    };
  }, []);

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  };

  const ensureLocalStream = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: true 
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
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
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
          remoteVideoRef.current.play().catch(e => {
            console.error("Error playing remote video:", e);
            setTimeout(() => {
              remoteVideoRef.current?.play().catch(console.error);
            }, 1000);
          });
        }
      }
    };

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const processQueuedIceCandidates = () => {
    if (peerConnectionRef.current?.remoteDescription) {
      iceCandidatesQueueRef.current.forEach(candidate => {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => console.error("Error processing queued candidate:", error));
      });
      iceCandidatesQueueRef.current = [];
    }
  };

  const startVideoCall = async (socket, sessionId) => {
    console.log("Starting video call for session:", sessionId);
    try {
      await ensureLocalStream();
      const pc = createPeerConnection(socket, sessionId);
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, sessionId });
      
      // Set a timeout to retry if connection fails
      retryTimeoutRef.current = setTimeout(() => {
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          console.log("Initial connection failed, retrying...");
          cleanupVideoCall();
          startVideoCall(socket, sessionId);
        }
      }, 10000);
    } catch (error) {
      console.error("Error starting video call:", error);
      setStatus("Failed to start video - please refresh");
    }
  };

  const cleanupVideoCall = async () => {
    console.log("Cleaning up video call");
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Close and cleanup peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote video
    if (remoteVideoRef.current) {
      const stream = remoteVideoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      remoteVideoRef.current.srcObject = null;
    }

    // Clear ICE candidates queue
    iceCandidatesQueueRef.current = [];
  };

  const handleStart = async () => {
    try {
      setIsStarted(true);
      setStatus("Starting camera...");
      
      // Reset connection attempt counter
      connectionAttemptRef.current = 0;
      
      // First ensure we can access the camera
      await ensureLocalStream();
      
      // Then initialize socket connection
      initializeSocket();
    } catch (error) {
      console.error("Failed to start:", error);
      setStatus("Failed to start - please check camera permissions");
      setIsStarted(false);
    }
  };

  const nextChat = async () => {
    if (!socket || !isStarted) return;
    
    console.log("Requesting next chat");
    setStatus("Looking for new match...");
    await cleanupVideoCall();
    setSessionId(null);
    currentSessionIdRef.current = null;
    setChat([]);
    
    try {
      await ensureLocalStream();
      socket.emit("next");
    } catch (error) {
      console.error("Failed to prepare for next chat:", error);
      setStatus("Failed to access camera - please refresh");
    }
  };

  const sendMessage = () => {
    if (socket && message && sessionId) {
      socket.emit("message", { text: message });
      setChat(prev => [...prev, { from: "me", text: message }]);
      setMessage("");
    }
  };

  const getStatusColor = () => {
    if (status.includes("Connected")) return "bg-green-100";
    if (status.includes("Looking") || status.includes("Waiting")) return "bg-blue-100";
    if (status.includes("failed") || status.includes("Failed")) return "bg-red-100";
    if (status.includes("disconnected") || status.includes("Disconnected")) return "bg-yellow-100";
    return "bg-blue-50";
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Random Video Chat</h1>
        <div className={`p-3 rounded-lg ${getStatusColor()}`}>
          <p className="font-semibold">{status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="space-y-2">
          <div className="flex items-center font-semibold">
            <Video size={18} className="mr-2" />
            <p>Your Camera</p>
          </div>
          <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
            {!localStreamRef.current && !isStarted && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <VideoOff size={48} className="opacity-50" />
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center font-semibold">
            <Video size={18} className="mr-2" />
            <p>Stranger's Camera</p>
          </div>
          <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
            {!sessionId && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <UserPlus size={48} className="opacity-50" />
              </div>
            )}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center font-semibold mb-2">
          <MessageSquare size={18} className="mr-2" />
          <p>Chat</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
          {chat.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              {isStarted ? "Messages will appear here" : "Start chat to begin messaging"}
            </div>
          ) : (
            chat.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 p-2 rounded-lg ${
                  msg.from === "me" 
                    ? "bg-blue-100 text-blue-800 ml-auto" 
                    : "bg-gray-200 text-gray-800"
                } max-w-[80%] break-words`}
              >
                <strong className="block text-xs opacity-75">
                  {msg.from === "me" ? "You" : "Stranger"}:
                </strong>
                <span>{msg.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {!isStarted ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full transition-colors duration-200 font-medium flex items-center justify-center"
          >
            <Video size={18} className="mr-2" />
            Start Chat
          </button>
        ) : (
          <>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none"
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={!sessionId}
              />
              <button
                onClick={sendMessage}
                disabled={!message || !sessionId}
                className={`px-3 py-2 rounded-lg flex items-center justify-center ${
                  !message || !sessionId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } transition-colors duration-200`}
              >
                <Send size={18} />
              </button>
            </div>
            <button
              onClick={nextChat}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 whitespace-nowrap font-medium"
            >
              Next Stranger
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;