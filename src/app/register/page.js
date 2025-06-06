"use client";

import { useState } from "react";
import { register } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
        className: "border-2 border-black bg-red-200 text-red-800 rounded-none shadow-[4px_4px_0_0_#000]",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Your password must be at least 8 characters long",
        variant: "destructive",
        className: "border-2 border-black bg-red-200 text-red-800 rounded-none shadow-[4px_4px_0_0_#000]",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      toast({
        title: "Registration successful!",
        description: "Welcome to our dating platform! Setting up your profile...",
        className: "border-2 border-black bg-green-200 text-green-800 rounded-none shadow-[4px_4px_0_0_#000]",
      });

      setTimeout(() => {
        router.push("/profile");
      }, 800);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Please check your information and try again",
        variant: "destructive",
        className: "border-2 border-black bg-red-200 text-red-800 rounded-none shadow-[4px_4px_0_0_#000]",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-6 flex items-center justify-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0_0_#000] bg-yellow-200">
          <CardHeader className="space-y-1 text-center border-b-4 border-black">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center mb-2"
            >
              <Heart className="h-12 w-12 text-pink-500" />
            </motion.div>
            <CardTitle className="text-3xl font-extrabold text-black">Create Account</CardTitle>
            <p className="text-gray-600">Start your journey to find meaningful connections</p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="text-lg font-bold text-black">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="border-2 border-black rounded-none focus:ring-0 focus:border-pink-500 bg-white text-black placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-lg font-bold text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="border-2 border-black rounded-none focus:ring-0 focus:border-pink-500 bg-white text-black placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-lg font-bold text-black">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="border-2 border-black rounded-none focus:ring-0 focus:border-pink-500 bg-white text-black placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-black font-bold">Must be at least 8 characters</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Button
                  type="submit"
                  className="w-full border-2 border-black rounded-none bg-pink-500 text-white hover:bg-pink-600 shadow-[4px_4px_0_0_#000] transition-transform duration-200 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </motion.div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-black" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-yellow-200 px-2 text-black font-bold">or sign up with</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Button
                variant="outline"
                className="w-full border-2 border-black rounded-none bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0_0_#000] transition-transform duration-200 hover:scale-105"
                onClick={() => window.location.href = "https://dating-backend-1h4q.onrender.com/auth/google"}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M12.3 5.8c1.7 0 3.3.6 4.6 1.8l3.5-3.5C18.1 2.1 15.3 1 12.3 1 7.3 1 3 4.1 1.3 8.5l4.1 3.2c1-2.9 3.8-5.9 6.9-5.9z" fill="#EA4335"/>
                  <path d="M23.7 12.3c0-.9-.1-1.8-.3-2.7H12.3v5h6.4c-.3 1.4-1.1 2.6-2.3 3.4l4 3.1c2.3-2.1 3.6-5.3 3.6-8.8z" fill="#4285F4"/>
                  <path d="M5.4 14.3c-.3-.9-.5-1.8-.5-2.8 0-1 .2-1.9.5-2.8L1.3 5.5C.5 7.5 0 9.8 0 12.3c0 2.5.5 4.8 1.3 6.8l4.1-3.2z" fill="#FBBC05"/>
                  <path d="M12.3 23.5c3 0 5.5-1 7.4-2.7l-4-3.1c-1.1.7-2.5 1.2-3.9 1.2-3.1 0-5.9-2.9-6.9-5.9l-4.1 3.2c1.7 4.4 6 7.3 11 7.3z" fill="#34A853"/>
                </svg>
                Continue with Google
              </Button>
            </motion.div>
          </CardContent>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="p-6 pt-0 text-center"
          >
            <p className="text-sm text-black font-bold">
              Already have an account?{" "}
              <a href="/login" className="text-pink-600 hover:text-pink-800 transition-colors font-bold">
                Sign in
              </a>
            </p>
          </motion.div>
        </Card>
      </motion.div>
      <Toaster />
    </div>
  );
}