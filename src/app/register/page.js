"use client";

import { useState } from "react";
import { register } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";

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
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Your password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      toast({
        title: "Registration successful!",
        description: "Welcome to our dating platform! Setting up your profile...",
        variant: "default",
      });
      
      // Small delay before redirect for toast to be visible
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
      
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Please check your information and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Heart className="h-10 w-10 text-pink-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-pink-700">Create Account</CardTitle>
          <CardDescription>
            Start your journey to find meaningful connections
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="focus:border-pink-500 focus:ring-pink-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="focus:border-pink-500 focus:ring-pink-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="focus:border-pink-500 focus:ring-pink-500"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or sign up with</span>
          </div>
        </div>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = "https://dating-backend.onrender.com/auth/google"}
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
          
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-pink-600 hover:text-pink-800 transition-colors">
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  );
}