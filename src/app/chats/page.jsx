import { Suspense } from 'react';
import Chats from './Chat';

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      <p className="text-2xl text-gray-800">Loading chats...</p>
    </div>}>
      <Chats />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';