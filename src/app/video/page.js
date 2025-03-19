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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch((e) => console.error("Error playing local video:", e));
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
      // First clear everything
      stopVideoCall(); // Ensure clean slate before starting new call
      
      // Update state with new session info
      setSessionId(newSessionId || null);
      currentSessionIdRef.current = newSessionId || null;
      setStatus("Connecting...");
      setChat([]);
      
      // Small delay before starting new call to ensure everything is reset
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
      newSocket.emit("next"); // Auto-request next stranger
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
    console.log("Creating new peer connection for session:", sessionId);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }, // Added additional STUN server
        // Replace with your TURN server if available
      ],
      iceCandidatePoolSize: 10 // Add this to improve connectivity
    });
  
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, sessionId: sessionId || null });
      }
    };
  
// Update your remoteVideoRef handling in ontrack event
pc.ontrack = (event) => {
  console.log("Received remote track for session:", sessionId, "Stream:", event.streams[0]);
  if (remoteVideoRef.current && event.streams[0]) {
    // Ensure we're updating with the current session
    if (currentSessionIdRef.current === sessionId) {
      remoteVideoRef.current.srcObject = event.streams[0];
      
      // Use loadedmetadata event to safely play after video is ready
      const playVideo = () => {
        remoteVideoRef.current.play()
          .catch((e) => {
            console.error("Error playing remote video:", e);
            // If it fails, try again after a short delay
            if (e.name === "AbortError") {
              setTimeout(() => {
                if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                  remoteVideoRef.current.play().catch(err => 
                    console.error("Retry play failed:", err)
                  );
                }
              }, 500);
            }
          });
      };
      
      if (remoteVideoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        playVideo();
      } else {
        remoteVideoRef.current.onloadedmetadata = playVideo;
      }
      
      setStatus("Connected");
    } else {
      console.warn("Received track for stale session:", sessionId);
    }
  } else {
    console.warn("Remote video ref not available or no stream received");
  }
};
  
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState, "for session:", sessionId);
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
          // Consider automatic reconnection here
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
    if (!localStreamRef.current) {
      await new Promise((resolve) => {
        const checkStream = setInterval(() => {
          if (localStreamRef.current) {
            clearInterval(checkStream);
            resolve();
          }
        }, 100);
      });
    }
  
    try {
      const stream = localStreamRef.current;
      if (!stream) throw new Error("Local stream not available");
  
      // Ensure clean slate - explicitly clear remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.load();
      }
      
      // Reset peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidatesQueueRef.current = [];
  
      // Create new connection
      const pc = createPeerConnection(socket, sessionId);
      stream.getTracks().forEach((track) => {
        console.log("Adding track:", track, "to session:", sessionId);
        pc.addTrack(track, stream);
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Sending offer for session:", sessionId);
      socket.emit("offer", { offer, sessionId });
  
      // Enhanced retry mechanism for remote stream
      let retryCount = 0;
      const maxRetries = 8; // Increased retry count
      const retryInterval = setInterval(() => {
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
          console.warn("Max retries reached for getting remote stream");
          // Force reconnection attempt after max retries
          if (!remoteVideoRef.current.srcObject && pc.iceConnectionState !== "connected") {
            console.log("Forcing reconnection after failed attempts");
            socket.emit("next");
          }
        } else if (remoteVideoRef.current.srcObject) {
          clearInterval(retryInterval);
          console.log("Remote stream connected successfully");
        } else if (pc.getReceivers().length > 0 && pc.getReceivers().some(r => r.track)) {
          try {
            const remoteStream = new MediaStream(
              pc.getReceivers()
                .filter(receiver => receiver.track)
                .map(receiver => receiver.track)
            );
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((e) => console.error("Error playing remote video on retry:", e));
            clearInterval(retryInterval);
            console.log("Remote stream established on retry:", retryCount);
          } catch (e) {
            console.error("Error setting up remote stream:", e);
          }
        } else {
          console.log(`Retry ${retryCount + 1}/${maxRetries} - Waiting for remote stream in session:`, sessionId);
          retryCount++;
        }
      }, 1000);
    } catch (error) {
      console.error("Error in startVideoCall:", error);
      setStatus("Failed to connect");
      alert("Failed to start video call: " + error.message);
    }
  };

  // Stop and clean up the video call
  const stopVideoCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onsignalingstatechange = null;
      peerConnectionRef.current = null;
    }
    
    if (remoteVideoRef.current) {
      // Remove event listeners first
      remoteVideoRef.current.onloadedmetadata = null;
      remoteVideoRef.current.pause();
      // After pause, then clear source
      setTimeout(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      }, 100);
    }
    
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
      stopVideoCall(); // Fully stop current call
      setSessionId(null);
      currentSessionIdRef.current = null;
      setStatus("Looking for a new stranger...");
      setChat([]);
  
      // Make sure remote video element is fully reset
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.load(); // Force reset video element
      }
  
      // Wait to ensure backend cleanup and socket events propagate
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Increased to 1.5 seconds
  
      socket.emit("next");
  
      // Ensure local video remains active
      if (!localVideoRef.current.srcObject && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch((e) => console.error("Error replaying local video:", e));
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stranger Video Chat</h1>
      <h2>Status: {status}</h2>
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <p><strong>Your Camera</strong></p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "300px", border: "1px solid black" }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <p><strong>Stranger's Camera</strong></p>
          <video
  ref={remoteVideoRef}
  autoPlay
  playsInline
  style={{ width: "300px", border: "1px solid black" }}
  onError={(e) => console.error("Remote video error:", e)}
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
      <button onClick={sendMessage} style={{ marginRight: "10px", padding: "5px 10px" }}>
        Send
      </button>
      <button onClick={nextChat} style={{ padding: "5px 10px" }}>
        Next Stranger
      </button>
    </div>
  );
};

export default Chat;