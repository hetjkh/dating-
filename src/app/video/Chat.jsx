"use client";

import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [status, setStatus] = useState("Disconnected");
  const [sessionId, setSessionId] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const localStreamRef = useRef(null);
  const currentSessionIdRef = useRef(null);

  // Initialize local video stream
  useEffect(() => {
    const startLocalVideo = async () => {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(e => console.error("Error playing local video:", e));
        }
      } catch (error) {
        console.error("Error initializing local video:", error);
        setStatus("Camera access failed: " + error.message);
      }
    };
    startLocalVideo();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // Socket.IO and WebRTC setup
  useEffect(() => {
    const newSocket = io("https://dating-backend-1h4q.onrender.com", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setStatus("Looking for a stranger...");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setStatus("Disconnected - trying to reconnect...");
      stopVideoCall();
    });

    newSocket.on("waiting", ({ message }) => {
      console.log("Waiting:", message);
      setStatus(message);
      setChat([]);
      setSessionId(null);
      currentSessionIdRef.current = null;
      stopVideoCall();
    });

    newSocket.on("paired", async ({ message, sessionId: newSessionId }) => {
      console.log("Paired with new session:", newSessionId);
      await stopVideoCall();
      setSessionId(newSessionId);
      currentSessionIdRef.current = newSessionId;
      setStatus("Connecting video...");
      setChat([]);
      
      // Delay starting the video call slightly to ensure clean state
      setTimeout(() => {
        startVideoCall(newSocket, newSessionId);
      }, 1000);
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
      stopVideoCall();
    });

    newSocket.on("offer", async ({ offer, sessionId: offerSessionId }) => {
      console.log("Received offer for session:", offerSessionId);
      if (offerSessionId !== currentSessionIdRef.current) {
        console.warn("Ignoring offer for wrong session");
        return;
      }

      try {
        await stopVideoCall();
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
      if (answerSessionId !== currentSessionIdRef.current || !peerConnectionRef.current) {
        console.warn("Ignoring answer for wrong session");
        return;
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        processQueuedIceCandidates();
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
      stopVideoCall();
      newSocket.disconnect();
    };
  }, []);

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
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(e => {
          console.error("Error playing remote video:", e);
          // Retry playing after a short delay
          setTimeout(() => {
            remoteVideoRef.current?.play().catch(console.error);
          }, 1000);
        });
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
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(socket, sessionId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, sessionId });
    } catch (error) {
      console.error("Error starting video call:", error);
      setStatus("Failed to start video - please refresh");
    }
  };

  const stopVideoCall = async () => {
    console.log("Stopping video call");
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    iceCandidatesQueueRef.current = [];
  };

  const nextChat = async () => {
    console.log("Requesting next chat");
    if (socket) {
      setStatus("Looking for new match...");
      await stopVideoCall();
      setSessionId(null);
      currentSessionIdRef.current = null;
      setChat([]);
      socket.emit("next");
    }
  };

  const sendMessage = () => {
    if (socket && message && sessionId) {
      socket.emit("message", { text: message });
      setChat(prev => [...prev, { from: "me", text: message }]);
      setMessage("");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Random Video Chat</h1>
        <div className="bg-blue-100 p-3 rounded">
          <p className="font-semibold">Status: {status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <p className="font-semibold">Your Camera</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full bg-black rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Stranger's Camera</p>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full bg-black rounded-lg"
          />
        </div>
      </div>

      <div className="mb-6 bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 p-2 rounded ${
              msg.from === "me" ? "bg-blue-100 ml-auto" : "bg-white"
            } max-w-[80%]`}
          >
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
        <button
          onClick={nextChat}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Next Stranger
        </button>
      </div>
    </div>
  );
};

export default Chat;