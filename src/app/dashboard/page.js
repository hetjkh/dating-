"use client"

import { useEffect, useState } from "react"
import { getProfile, logout } from "@/utils/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeartIcon, MessageCircle, Video, Shield, UserCheck, Zap, Gift, Camera, Mic, Users, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion" // Added for animations

export default function LandingPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/register")
    }
  }

  const getTrustBadgeColor = (level) => {
    switch (level) {
      case "Low Trust":
        return "bg-yellow-400 text-black font-black border-4 border-black rotate-1"
      case "Medium Trust":
        return "bg-blue-400 text-black font-black border-4 border-black -rotate-1"
      case "High Trust":
        return "bg-green-400 text-black font-black border-4 border-black rotate-1"
      case "Top Trust":
        return "bg-purple-400 text-black font-black border-4 border-black -rotate-1"
      default:
        return "bg-gray-300 text-black font-black border-4 border-black"
    }
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-yellow-100 text-black"}`}>
      {/* Dark Mode Toggle */}
      <motion.div 
        className="fixed top-4 right-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? "bg-yellow-300" : "bg-gray-800"}`}
        >
          {darkMode ? <Sun className="w-6 h-6 text-black" /> : <Moon className="w-6 h-6 text-white" />}
        </Button>
      </motion.div>

      {/* Navbar */}
      <motion.nav 
        className={`sticky top-0 z-40 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-black"} border-b-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container flex items-center justify-between h-20 px-4 mx-auto">
          <div className="flex items-center">
            <HeartIcon className="w-10 h-10 mr-2 text-red-500 rotate-6 animate-pulse" />
            <span className="text-2xl font-black transform -rotate-2" style={{fontFamily: "'Comic Sans MS', cursive"}}>HeartSync</span>
          </div>

          <div className="hidden space-x-8 md:flex">
            {["Features", "Plans", "Trust System", "About"].map((item, i) => (
              <motion.a
                key={i}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-xl font-bold hover:text-red-500 transition-colors transform hover:rotate-2"
                style={{textDecoration: "", textDecorationThickness: "3px", textUnderlineOffset: "4px"}}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 border-4 border-t-red-500 border-black rounded-full animate-spin"></div>
            ) : user ? (
              <>
                <div className="flex items-center mr-2">
                  <motion.div 
                    className="w-10 h-10 rounded-md bg-cyan-300 border-4 border-black flex items-center justify-center font-black transform rotate-3"
                    whileHover={{ rotate: 6 }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </motion.div>
                  <span className="ml-2 font-black">{user.name}</span>
                </div>
                <Button 
                  onClick={handleLogout} 
                  className={`${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 hover:bg-blue-400"} text-black font-black border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/login")}
                  className={`${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-300 hover:bg-green-400"} text-black font-black border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all transform -rotate-1`}
                >
                  Login
                </Button>
                <Button 
                  onClick={() => router.push("/register")} 
                  className={`${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-300 hover:bg-red-400"} text-black font-black border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all transform rotate-1`}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className={`relative ${darkMode ? "bg-gray-800" : "bg-pink-200"} py-20 border-b-8 border-black`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.h1 
                className="text-5xl font-black mb-6 transform -rotate-2"
                style={{textShadow: "4px 4px 0px #FCD34D"}}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                Find Your Perfect <span className="">Match</span>
              </motion.h1>
              <motion.p 
                className={`text-xl font-bold mb-8 max-w-md transform rotate-1 ${darkMode ? "bg-gray-700" : "bg-blue-200"} p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                HeartSync uses advanced matching technology to help you find meaningful connections based on
                compatibility, interests, and trust.
              </motion.p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.button
                  onClick={handleGetStarted}
                  className={`${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-300 hover:bg-red-400"} text-black font-black border-4 border-black px-6 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all transform rotate-1 text-xl`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
                <motion.button
                  onClick={() => router.push("#features")}
                  className={`${darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-300 hover:bg-purple-400"} text-black font-black border-4 border-black px-6 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all transform -rotate-1 text-xl`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.button>
              </div>
              <motion.div 
                className="mt-6 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Badge className={`${darkMode ? "bg-green-600" : "bg-green-300"} text-black font-bold border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-2 mr-2`}>First 24h Free</Badge>
                <Badge className={`${darkMode ? "bg-cyan-600" : "bg-cyan-300"} text-black font-bold border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-2`}>Face Verified</Badge>
              </motion.div>
            </div>
            <motion.div 
              className="md:w-1/2 relative"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className={`w-full h-80 md:h-96 ${darkMode ? "bg-gray-700" : "bg-yellow-300"} rounded-none border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 overflow-hidden relative`}>
                <div className="relative p-6 flex flex-col items-center justify-center h-full">
                  <motion.div 
                    className="w-28 h-28 rounded-md bg-red-300 mb-4 flex items-center justify-center border-4 border-black transform rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    animate={{ rotate: [6, -6, 6], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <HeartIcon className="w-16 h-16 text-black" />
                  </motion.div>
                  <p className={`${darkMode ? "bg-gray-800" : "bg-white"} text-center text-black font-bold max-w-xs px-4 py-2 border-4 border-black transform -rotate-2`}>
                    Join thousands of others who have found their perfect match on HeartSync
                  </p>
                  <div className="flex mt-6 space-x-2">
                    {["Video Chat", "Voice Match", "Swipe"].map((badge, i) => (
                      <motion.div
                        key={i}
                        className={`bg-${i === 0 ? darkMode ? "pink-600" : "pink-300" : i === 1 ? darkMode ? "purple-600" : "purple-300" : darkMode ? "cyan-600" : "cyan-300"} text-black font-bold border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform ${i % 2 === 0 ? 'rotate-3' : '-rotate-3'}`}
                        whileHover={{ y: -5 }}
                      >
                        {badge}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        className={`py-16 ${darkMode ? "bg-gray-800" : "bg-cyan-100"} border-b-8 border-black`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container px-4 mx-auto">
          <motion.h2 
            className="text-4xl font-black text-center mb-12 transform -rotate-1"
            style={{textShadow: "3px 3px 0px #60A5FA"}}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            Our Core Features
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Video className="w-8 h-8 text-black" />,
                title: "Random Video Connect",
                description:
                  "Meet new people through random video matching. If you like each other, start chatting and build a connection.",
                bg: darkMode ? "bg-green-600" : "bg-green-300",
                rotate: "rotate-2"
              },
              {
                icon: <MessageCircle className="w-8 h-8 text-black" />,
                title: "Reaction-Based Chat",
                description:
                  "Express yourself beyond words with reactions like laughs, wows, and likes directly on messages.",
                bg: darkMode ? "bg-red-600" : "bg-red-300",
                rotate: "-rotate-1"
              },
              {
                icon: <Zap className="w-8 h-8 text-black" />,
                title: "Smart Swipe System",
                description:
                  "Our advanced algorithm learns your preferences to suggest better matches the more you use the app.",
                bg: darkMode ? "bg-yellow-600" : "bg-yellow-300",
                rotate: "rotate-1"
              },
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className={`overflow-hidden ${feature.bg} border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform ${feature.rotate}`}>
                  <CardContent className="p-6">
                    <motion.div 
                      className="w-16 h-16 rounded-md bg-white flex items-center justify-center mb-4 border-4 border-black transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      whileHover={{ rotate: 0 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-2xl font-black mb-2">{feature.title}</h3>
                    <p className="font-bold">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            {[
              {
                icon: <Mic className="w-6 h-6 text-black" />,
                title: "Voice Matching",
                description: "Share voice notes to find matches based on voice compatibility.",
                bg: darkMode ? "bg-blue-600" : "bg-blue-300",
                rotate: "rotate-2"
              },
              {
                icon: <Camera className="w-6 h-6 text-black" />,
                title: "Profile Video Intro",
                description: "Upload short videos about yourself for more authentic connections.",
                bg: darkMode ? "bg-purple-600" : "bg-purple-300",
                rotate: "-rotate-1"
              },
              {
                icon: <Shield className="w-6 h-6 text-black" />,
                title: "AI Content Safety",
                description: "Auto-blur NSFW content to keep interactions safe and appropriate.",
                bg: darkMode ? "bg-orange-600" : "bg-orange-300",
                rotate: "rotate-1"
              },
              {
                icon: <Users className="w-6 h-6 text-black" />,
                title: "Themed Group Chats",
                description: "Join video chat rooms based on interests and themes.",
                bg: darkMode ? "bg-pink-600" : "bg-pink-300",
                rotate: "-rotate-2"
              },
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="flex items-start"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`mr-4 w-12 h-12 rounded-md ${feature.bg} flex items-center justify-center flex-shrink-0 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform ${feature.rotate}`}>
                  {feature.icon}
                </div>
                <div className="border-b-4 border-black pb-2">
                  <h4 className="font-black mb-1 text-lg">{feature.title}</h4>
                  <p className="text-sm font-bold">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Trust System Section */}
      <motion.section 
        id="trust-system" 
        className={`py-16 ${darkMode ? "bg-gray-800" : "bg-green-100"} border-b-8 border-black`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container px-4 mx-auto">
          <motion.h2 
            className="text-4xl font-black text-center mb-4 transform rotate-1"
            style={{textShadow: "3px 3px 0px #86EFAC"}}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            Trust Level System
          </motion.h2>
          <motion.p 
            className={`text-center font-bold max-w-2xl mx-auto mb-12 ${darkMode ? "bg-gray-700" : "bg-white"} p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Our unique trust system helps create a safe community and rewards positive behavior.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                level: "Low Trust",
                description: "Starting level for all new users. Limited access to some premium features.",
                userType: "New Users",
                bg: darkMode ? "bg-yellow-600" : "bg-yellow-300",
                rotate: "rotate-2"
              },
              {
                level: "Medium Trust",
                description: "Achieved after positive interactions and completing profile verification.",
                userType: "Established Users",
                bg: darkMode ? "bg-blue-600" : "bg-blue-300",
                rotate: "-rotate-1"
              },
              {
                level: "High Trust",
                description: "For users with face verification and consistent positive community engagement.",
                userType: "Valued Members",
                bg: darkMode ? "bg-green-600" : "bg-green-300",
                rotate: "rotate-1"
              },
              {
                level: "Top Trust",
                description: "Our most trusted users who receive priority matching and exclusive features.",
                userType: "Elite Status",
                bg: darkMode ? "bg-purple-600" : "bg-purple-300",
                rotate: "-rotate-2"
              },
            ].map((trust, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className={`${trust.bg} border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform ${trust.rotate}`}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex justify-between items-center">
                      <Badge className={getTrustBadgeColor(trust.level)}>{trust.level}</Badge>
                      <span className={`${darkMode ? "bg-gray-700" : "bg-white"} font-black px-2 py-1 border-2 border-black rotate-2`}>{trust.userType}</span>
                    </div>
                    <p className="font-bold">{trust.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className={`mt-12 ${darkMode ? "bg-orange-600" : "bg-orange-200"} rounded-none p-6 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-black mb-4 transform -rotate-1">How to Boost Your Trust Level</h3>
            <ul className="space-y-3">
              {[
                "Complete face verification to prove your identity",
                "Maintain positive interactions without reports",
                "Complete your profile with authentic information",
                "Participate regularly and follow community guidelines"
              ].map((item, i) => (
                <motion.li 
                  key={i} 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                >
                  <UserCheck className={`w-6 h-6 mr-2 flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-white"} p-1 border-2 border-black transform rotate-3`} />
                  <span className="font-bold">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* Subscription Plans */}
      <motion.section 
        id="plans" 
        className={`py-16 ${darkMode ? "bg-gray-800" : "bg-purple-100"} border-b-8 border-black`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container px-4 mx-auto">
          <motion.h2 
            className="text-4xl font-black text-center mb-4 transform -rotate-1"
            style={{textShadow: "3px 3px 0px #E9D5FF"}}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            Subscription Plans
          </motion.h2>
          <motion.p 
            className={`text-center font-bold max-w-2xl mx-auto mb-12 ${darkMode ? "bg-gray-700" : "bg-white"} p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Choose the plan that fits your dating journey
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Free Plan",
                price: "$0",
                description: "Perfect for getting started",
                features: [
                  "Basic profile creation",
                  "Limited swipes per day",
                  "Access to basic chat",
                  "No priority matching",
                ],
                buttonText: "Current Plan",
                buttonColor: darkMode ? "bg-gray-600" : "bg-gray-300",
                rotate: "-rotate-1",
                bg: darkMode ? "bg-gray-700" : "bg-white"
              },
              {
                name: "Silver Plan",
                price: "$14.99",
                description: "Enhanced features and visibility",
                features: [
                  "Everything in Free plan",
                  "Unlimited swipes",
                  "Profile boosting (1x/week)",
                  "See who liked you",
                ],
                buttonText: "Upgrade Now",
                buttonColor: darkMode ? "bg-pink-600" : "bg-pink-300",
                rotate: "rotate-2",
                bg: darkMode ? "bg-pink-800" : "bg-pink-100",
                popular: true
              },
              {
                name: "Gold Plan",
                price: "$29.99",
                description: "Premium experience",
                features: [
                  "Everything in Silver plan",
                  "Priority matching",
                  "Daily profile boost",
                  "VIP video chat rooms",
                ],
                buttonText: "Go Premium",
                buttonColor: darkMode ? "bg-yellow-600" : "bg-yellow-300",
                rotate: "-rotate-1",
                bg: darkMode ? "bg-yellow-800" : "bg-yellow-100"
              },
            ].map((plan, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card
                  className={`${plan.bg} border-8 ${plan.popular ? "border-red-500" : "border-black"} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform ${plan.rotate} relative`}
                >
                  {plan.popular && (
                    <motion.div 
                      className="absolute top-0 right-0 transform translate-x-2 -translate-y-6 rotate-6"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Badge className="bg-red-400 text-black font-black px-4 py-2 border-4 border-black">Most Popular</Badge>
                    </motion.div>
                  )}
                  <CardContent className="p-0">
                    <div className="p-6 border-b-8 border-black">
                      <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                      <p className="font-bold mb-4">{plan.description}</p>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-black" style={{textShadow: "2px 2px 0px #FCD34D"}}>{plan.price}</span>
                        <span className="font-bold ml-1">/month</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li 
                            key={featureIndex} 
                            className="flex items-center"
                            whileHover={{ x: 5 }}
                          >
                            <div 
                              className={`w-5 h-5 mr-2 border-2 border-black flex items-center justify-center ${feature.includes("No") ? darkMode ? "bg-red-700" : "bg-red-300" : darkMode ? "bg-green-700" : "bg-green-300"}`}
                            >
                              {feature.includes("No") ? "✘" : "✓"}
                            </div>
                            <span className={`font-bold ${feature.includes("No") ? "text-gray-500 line-through" : ""}`}>
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                      <motion.button 
                        className={`w-full mt-6 ${plan.buttonColor} text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {plan.buttonText}
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className={`mt-8 p-4 ${darkMode ? "bg-blue-700" : "bg-blue-200"} rounded-none border-4 border-black transform rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-center font-bold">
              <Gift className="inline-block w-6 h-6 mr-1 transform -rotate-6 animate-bounce" />
              All new users get a 24-hour trial of premium features upon registration!
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className={`py-16 ${darkMode ? "bg-gray-800" : "bg-red-200"} border-b-8 border-black`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container px-4 mx-auto text-center">
          <motion.h2 
            className="text-4xl font-black mb-6 transform rotate-1"
            style={{textShadow: "3px 3px 0px #FCA5A5"}}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            Ready to Find Your Perfect Match?
          </motion.h2>
          <motion.p 
            className={`max-w-2xl mx-auto mb-8 font-bold ${darkMode ? "bg-gray-700" : "bg-white"} p-5 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Join thousands of users who've found meaningful connections on HeartSync. Start your journey today with our
            24-hour premium trial.
          </motion.p>
          <motion.button
            onClick={handleGetStarted}
            className={`${darkMode ? "bg-cyan-600 hover:bg-cyan-700" : "bg-cyan-300 hover:bg-cyan-400"} text-black font-black text-xl border-8 border-black px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all transform rotate-2`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Get Started Now
          </motion.button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className={`${darkMode ? "bg-gray-800" : "bg-yellow-200"} py-8 border-t-8 border-black`}>
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            {[
              {
                title: "Company",
                links: ["About Us", "Careers", "Press"]
              },
              {
                title: "Resources",
                links: ["Blog", "Help Center", "Safety Tips"]
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy"]
              },
              {
                title: "Connect",
                links: ["Facebook", "Twitter", "Instagram"]
              }
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-black mb-4 text-xl transform rotate-1 underline">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <motion.li 
                      key={j}
                      whileHover={{ x: 5 }}
                    >
                      <a 
                        href="#" 
                        className={`font-bold ${darkMode ? "hover:bg-cyan-700" : "hover:bg-cyan-300"} hover:border-b-2 hover:border-black transition-colors transform hover:-rotate-1 inline-block`}
                      >
                        {link}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
          <div className="mt-8 pt-8 border-t-4 border-black text-center">
            <p className="font-bold">© 2023 HeartSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}