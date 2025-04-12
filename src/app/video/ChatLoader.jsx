"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./Chat"), { ssr: false });

const ChatLoader = () => {
  return <Chat />;
};

export default ChatLoader;