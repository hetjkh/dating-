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
      stopVideoCall();
      setSessionId(newSessionId || null);
      currentSessionIdRef.current = newSessionId || null;
      setStatus("Connecting...");
      setChat([]);
      startVideoCall(newSocket, newSessionId || null);
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
    });

    newSocket.on("offer", async ({ offer, from, sessionId: offerSessionId }) => {
      const effectiveSessionId = offerSessionId !== undefined ? offerSessionId : sessionId || null;
      if (effectiveSessionId !== currentSessionIdRef.current) {
        console.warn("Ignoring offer for stale session:", effectiveSessionId);
        return;
      }
      if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
        createPeerConnection(newSocket, effectiveSessionId);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        newSocket.emit("answer", { answer, sessionId: effectiveSessionId });
        processQueuedIceCandidates();
      } else if (peerConnectionRef.current.signalingState === "stable") {
        console.warn("Received offer in stable state, resetting connection for session:", effectiveSessionId);
        stopVideoCall();
        createPeerConnection(newSocket, effectiveSessionId);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        newSocket.emit("answer", { answer, sessionId: effectiveSessionId });
        processQueuedIceCandidates();
      } else {
        console.error("Unexpected signaling state:", peerConnectionRef.current.signalingState);
      }
    });

    newSocket.on("answer", async ({ answer, from, sessionId: answerSessionId }) => {
      const effectiveSessionId = answerSessionId !== undefined ? answerSessionId : sessionId || null;
      if (effectiveSessionId !== currentSessionIdRef.current || !peerConnectionRef.current) {
        console.warn("Ignoring answer for stale session or missing peer connection:", effectiveSessionId);
        return;
      }
      if (peerConnectionRef.current.signalingState === "have-local-offer") {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        processQueuedIceCandidates();
      } else {
        console.error("Unexpected signaling state for answer:", peerConnectionRef.current.signalingState);
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
      console.log("Received remote track for session:", sessionId, "Stream:", event.streams[0]);
      if (remoteVideoRef.current && event.streams[0] && currentSessionIdRef.current === sessionId) {
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch((e) => {
            console.error("Error playing remote video:", e);
            if (e.name === "AbortError") {
              setTimeout(() => {
                if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                  remoteVideoRef.current.play().catch((err) =>
                    console.error("Retry play failed:", err)
                  );
                }
              }, 500);
            }
          });
        }
        setStatus("Connected");
      } else {
        console.warn("Remote video ref not available or session mismatch");
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
          setStatus("Connection failed - please try again");
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

      stopVideoCall();

      const pc = createPeerConnection(socket, sessionId);
      stream.getTracks().forEach((track) => {
        console.log("Adding track:", track, "to session:", sessionId);
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, sessionId });

      let retryCount = 0;
      const maxRetries = 20;
      const retryInterval = setInterval(async () => {
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
          console.warn("Max retries reached for remote stream in session:", sessionId);
          setStatus("Failed to connect - please try again");
        } else if (remoteVideoRef.current.srcObject) {
          clearInterval(retryInterval);
          console.log("Remote stream connected successfully for session:", sessionId);
        } else {
          const receivers = pc.getReceivers();
          if (receivers.length > 0 && receivers.some((r) => r.track)) {
            try {
              const remoteStream = new MediaStream(receivers.map((r) => r.track));
              if (remoteVideoRef.current.srcObject !== remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                await remoteVideoRef.current.play();
              }
              clearInterval(retryInterval);
              console.log("Remote stream set up on retry:", retryCount);
            } catch (e) {
              console.error("Error playing remote stream:", e);
            }
          } else {
            console.log(`Retry ${retryCount + 1}/${maxRetries} - Waiting for remote stream`);
            retryCount++;
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error in startVideoCall:", error);
      setStatus("Failed to connect - please try again");
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
      remoteVideoRef.current.pause();
      remoteVideoRef.current.srcObject = null; // Clear srcObject after pause
      remoteVideoRef.current.onloadedmetadata = null;
      remoteVideoRef.current.load(); // Reset video element
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
      console.log("User manually requested next chat");
      stopVideoCall();
      setSessionId(null);
      currentSessionIdRef.current = null;
      setStatus("Looking for a new stranger...");
      setChat([]);
      socket.emit("next");

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