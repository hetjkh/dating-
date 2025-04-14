"use client"
import React from 'react'
import Link from 'next/link'

const Page = () => {
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Hello</h1>
      <nav className="space-y-1">
        <Link href="/video" className="text-blue-500 hover:underline">Video</Link>
        <Link href="/dashboard" className="text-blue-500 hover:underline">Dashboard</Link>
        <Link href="/login" className="text-blue-500 hover:underline">Login</Link>
        <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
        <Link href="/profile" className="text-blue-500 hover:underline">Profile</Link>
      </nav>
    </div>
  )
}

export default Page

