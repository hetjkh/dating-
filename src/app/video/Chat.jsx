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
  // Add ref to track if play() is pending
  const isPlayingRef = useRef({ local: false, remote: false });

  // Utility to safely play a video
  const safePlay = async (videoRef, type) => {
    if (!videoRef.current || isPlayingRef.current[type]) return;
    try {
      isPlayingRef.current[type] = true;
      await videoRef.current.play();
    } catch (error) {
      console.error(`Error playing ${type} video:`, error);
    } finally {
      isPlayingRef.current[type] = false;
    }
  };

  // Initialize local video stream
  useEffect(() => {
    const startLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await safePlay(localVideoRef, "local");
        }
      } catch (error) {
        console.error("Error initializing local video:", error);
        alert("Failed to access camera: " + error.message);
      }
    };
    startLocalVideo();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // Socket.IO and WebRTC setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      setStatus("Waiting...");
    });

    newSocket.on("waiting", ({ message }) => {
      setStatus(message);
      setChat([]);
      setSessionId(null);
      currentSessionIdRef.current = null;
      stopVideoCall();
    });

    newSocket.on("paired", ({ message, sessionId: newSessionId }) => {
      stopVideoCall(); // Ensure clean slate
      setSessionId(newSessionId || null);
      currentSessionIdRef.current = newSessionId || null;
      setStatus("Connecting...");
      setChat([]);
      setTimeout(() => {
        startVideoCall(newSocket, newSessionId || null);
      }, 500);
    });

    newSocket.on("message", ({ text, from }) => {
      setChat((prev) => [...prev, { from: "stranger", text }]);
    });

    newSocket.on("partner_left", ({ message }) => {
      setStatus("Disconnected - Partner Left");
      setChat([]);
      setSessionId(null);
      currentSessionIdRef.current = null;
      stopVideoCall();
      setStatus("Looking for a new stranger...");
      newSocket.emit("next");
    });

    newSocket.on("offer", async ({ offer, from, sessionId: offerSessionId }) => {
      const effectiveSessionId = offerSessionId !== undefined ? offerSessionId : sessionId || null;
      if (effectiveSessionId !== currentSessionIdRef.current) {
        console.warn("Ignoring offer for stale session:", effectiveSessionId);
        return;
      }
      if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
        createPeerConnection(newSocket, effectiveSessionId);
      } else if (peerConnectionRef.current.signalingState !== "stable") {
        console.warn("Resetting connection due to unstable state:", peerConnectionRef.current.signalingState);
        stopVideoCall();
        createPeerConnection(newSocket, effectiveSessionId);
      }
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        newSocket.emit("answer", { answer, sessionId: effectiveSessionId });
        processQueuedIceCandidates();
      } catch (error) {
        console.error("Error handling offer:", error);
        setStatus("Failed to connect");
      }
    });

    newSocket.on("answer", async ({ answer, from, sessionId: answerSessionId }) => {
      const effectiveSessionId = answerSessionId !== undefined ? answerSessionId : sessionId || null;
      if (effectiveSessionId !== currentSessionIdRef.current || !peerConnectionRef.current) {
        console.warn("Ignoring answer for stale session or missing peer connection:", effectiveSessionId);
        return;
      }
      if (peerConnectionRef.current.signalingState !== "have-local-offer") {
        console.warn("Cannot handle answer, state is:", peerConnectionRef.current.signalingState);
        return;
      }
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        processQueuedIceCandidates();
      } catch (error) {
        console.error("Error handling answer:", error);
        setStatus("Failed to connect");
      }
    });

    newSocket.on("ice-candidate", async ({ candidate, from, sessionId: candidateSessionId }) => {
      const effectiveSessionId = candidateSessionId !== undefined ? candidateSessionId : sessionId || null;
      if (effectiveSessionId !== currentSessionIdRef.current) {
        console.warn("Ignoring ICE candidate for stale session:", effectiveSessionId);
        return;
      }
      if (candidate && peerConnectionRef.current) {
        if (peerConnectionRef.current.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) =>
            console.error("Error adding ICE candidate:", e)
          );
        } else {
          iceCandidatesQueueRef.current.push(candidate);
        }
      }
    });

    newSocket.on("error", ({ message }) => {
      setStatus(`Error: ${message}`);
      alert(message);
    });

    setSocket(newSocket);
    return () => {
      stopVideoCall();
      newSocket.disconnect();
    };
  }, []);

  // Create a new WebRTC peer connection
  const createPeerConnection = (socket, sessionId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, sessionId: sessionId || null });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0] && currentSessionIdRef.current === sessionId) {
        // Only assign srcObject if it's different to avoid unnecessary reassignment
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          safePlay(remoteVideoRef, "remote");
        }
        setStatus("Connected");
      }
    };

    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          setStatus("Connected");
          break;
        case "disconnected":
          setStatus("Connection interrupted - trying to reconnect...");
          break;
        case "failed":
          setStatus("Connection failed");
          setTimeout(() => {
            if (currentSessionIdRef.current === sessionId) {
              socket.emit("next");
            }
          }, 3000);
          break;
        case "closed":
          setStatus("Disconnected");
          break;
        default:
          setStatus("Connecting...");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Process queued ICE candidates
  const processQueuedIceCandidates = () => {
    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
      while (iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) =>
          console.error("Error processing queued ICE candidate:", error)
        );
      }
    }
  };

  // Start a new video call
  const startVideoCall = async (socket, sessionId) => {
    try {
      // Ensure local stream is available
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await safePlay(localVideoRef, "local");
        }
      }

      // Reset remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Reset peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidatesQueueRef.current = [];

      const pc = createPeerConnection(socket, sessionId);
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, sessionId });
    } catch (error) {
      console.error("Error in startVideoCall:", error);
      setStatus("Failed to connect");
      alert("Failed to start video call: " + error.message);
    }
  };

  // Stop and clean up the video call
  const stopVideoCall = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      isPlayingRef.current.remote = false;
    }

    // Clear ICE candidate queue
    iceCandidatesQueueRef.current = [];

    setStatus("Disconnected");
  };

  // Send a chat message
  const sendMessage = () => {
    if (socket && message && sessionId !== undefined) {
      socket.emit("message", { text: message });
      setChat((prev) => [...prev, { from: "me", text: message }]);
      setMessage("");
    }
  };

  // Switch to the next stranger
  const nextChat = async () => {
    if (socket) {
      // Clean up current call
      stopVideoCall();
      setSessionId(null);
      currentSessionIdRef.current = null;
      setStatus("Looking for a new stranger...");
      setChat([]);

      // Ensure local stream is available
      if (!localStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            await safePlay(localVideoRef, "local");
          }
        } catch (error) {
          console.error("Error reinitializing local stream:", error);
          setStatus("Failed to access camera");
          return;
        }
      }

      // Emit next event
      socket.emit("next");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stranger Video Chat</h1>
      <h2>Status: {status}</h2>
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <p>
            <strong>Your Camera</strong>
          </p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "300px", border: "1px solid black" }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <p>
            <strong>Stranger's Camera</strong>
          </p>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "300px", border: "1px solid black" }}
          />
        </div>
      </div>
      <div style={{ height: "300px", overflowY: "scroll", marginBottom: "20px" }}>
        {chat.map((msg, idx) => (
          <p key={idx} style={{ margin: "5px 0" }}>
            <strong>{msg.from}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{ marginRight: "10px", padding: "5px" }}
      />
      <button
        onClick={sendMessage}
        style={{ marginRight: "10px", padding: "5px 10px" }}
      >
        Send
      </button>
      <button onClick={nextChat} style={{ padding: "5px 10px" }}>
        Next Stranger
      </button>
    </div>
  );
};

export default Chat;