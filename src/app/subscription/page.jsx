"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Star, CheckCircle, Sparkles, Info } from "lucide-react";
import confetti from "canvas-confetti";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState("silver");
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const COLORS = {
    primary: "#FF6B6B",
    secondary: "#4ECDC4",
    accent1: "#FFE66D",
    accent2: "#1A535C",
    accent3: "#F4A261",
    dark: "#2B2D42",
    light: "#F7FFF7",
  };

  const plans = [
    {
      name: "Free",
      price: "₹0/month",
      badge: "Starter",
      badgeColor: COLORS.accent1,
      shadowColor: "#FFFF00",
      features: [
        { name: "Video Calls", value: "10/day", tooltip: "Connect with up to 10 people daily via video calls." },
        { name: "Trust Points", value: "50", tooltip: "Earn 50 trust points to show you're a genuine user." },
        { name: "Badge", value: "Starter", tooltip: "Show off your Starter badge on your profile." },
        { name: "Profile Boost", value: "1x", tooltip: "Get noticed with a single profile boost." },
        { name: "Priority Matching", value: "No", tooltip: "Standard matching algorithm." },
        { name: "Ad-Free Experience", value: "No", tooltip: "Includes ads during usage." },
      ],
      description: "Perfect to spark your first connections!",
      progress: 30,
    },
    {
      name: "Silver",
      price: "₹499/month",
      badge: "Trusted",
      badgeColor: COLORS.primary,
      shadowColor: "#FF00FF",
      features: [
        { name: "Video Calls", value: "30/day", tooltip: "Connect with up to 30 people daily via video calls." },
        { name: "Trust Points", value: "150", tooltip: "Earn 150 trust points for a trusted profile." },
        { name: "Badge", value: "Trusted", tooltip: "Display a Trusted badge to stand out." },
        { name: "Profile Boost", value: "3x", tooltip: "Triple your visibility with 3x profile boosts." },
        { name: "Priority Matching", value: "Yes", tooltip: "Get prioritized in the matching algorithm." },
        { name: "Ad-Free Experience", value: "Yes", tooltip: "Enjoy an ad-free experience." },
      ],
      description: "More calls, more vibes, more connections!",
      progress: 60,
    },
    {
      name: "Gold",
      price: "₹999/month",
      badge: "Elite",
      badgeColor: COLORS.secondary,
      shadowColor: "#00FF00",
      features: [
        { name: "Video Calls", value: "Unlimited", tooltip: "Connect with as many people as you want daily!" },
        { name: "Trust Points", value: "300", tooltip: "Earn 300 trust points for an elite profile." },
        { name: "Badge", value: "Elite", tooltip: "Showcase an Elite badge for maximum credibility." },
        { name: "Profile Boost", value: "5x", tooltip: "Maximize visibility with 5x profile boosts." },
        { name: "Priority Matching", value: "Yes", tooltip: "Top priority in the matching algorithm." },
        { name: "Ad-Free Experience", value: "Yes", tooltip: "Completely ad-free experience." },
      ],
      description: "The ultimate SparkVibe experience for true connectors!",
      progress: 100,
    },
  ];

  const testimonials = [
    { name: "Aarav", plan: "Gold", quote: "Unlimited calls with Gold changed everything! I’ve met so many amazing people.", rating: 5 },
    { name: "Priya", plan: "Silver", quote: "The 3x profile boost really works! I get matched so much faster now.", rating: 4 },
    { name: "Rohan", plan: "Free", quote: "Started with the Free plan, and it’s already so much fun! Can’t wait to upgrade.", rating: 4 },
  ];

  const faqs = [
    {
      question: "What happens if I run out of video calls?",
      answer: "On Free and Silver plans, your daily video call limit resets at midnight IST. With Gold, you get unlimited calls, so you never run out!",
    },
    {
      question: "How do trust points work?",
      answer: "Trust points reflect your plan’s level and help others know you’re a genuine user. Higher points come with better badges: Starter (0-99), Trusted (100-199), and Elite (200+).",
    },
    {
      question: "What is a profile boost?",
      answer: "A profile boost increases your visibility in matchmaking. For example, a 3x boost means you’re three times more likely to be matched compared to a 1x boost.",
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime from your account settings. Your subscription benefits will continue until the end of the billing cycle.",
    },
  ];

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [COLORS.primary, COLORS.secondary, COLORS.accent1],
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 text-black font-['IBM_Plex_Mono']">
      {/* Hero Section */}
      <section className="text-center py-16 px-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h1
            className="text-5xl md:text-6xl font-bold inline-block bg-white px-6 py-3 border-4 border-black transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(255,107,107,1)]"
          >
            SparkVibe Subscriptions
          </h1>
          <p className="text-xl md:text-2xl mt-6 text-gray-800 max-w-2xl mx-auto">
            Choose your vibe, ignite your connections, and spark something amazing!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8"
          >
            <Button
              className="bg-yellow-300 text-black border-4 border-black px-6 py-3 text-lg font-bold transform rotate-2 hover:bg-yellow-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => {
                triggerConfetti();
                window.location.href = "/signup";
              }}
            >
              Get Started Now <Sparkles className="ml-2" />
            </Button>
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FF6B6B" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v4h-4v2h4v4h2v-4h4v-2h-4V0h-2zM6 34v4h4v-4h2v-4h-2v-4H6v4H2v2h4zm0-30v4H2v2h4v4h2V6h4V4H8V0H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')` }} />
      </section>

      {/* Plan Selector */}
      <section className="py-16 px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-white inline-block px-4 py-2 border-4 border-black transform -rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Pick Your Vibe
        </h2>
        <Tabs defaultValue="silver" onValueChange={setSelectedPlan} className="max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-3 gap-4 mb-8 bg-transparent">
            {plans.map((plan) => (
              <TabsTrigger
                key={plan.name}
                value={plan.name.toLowerCase()}
                className={`text-lg font-bold border-4 border-black px-4 py-2 transform ${selectedPlan === plan.name.toLowerCase() ? "bg-black text-white shadow-[6px_6px_0px_0px_rgba(78,205,196,1)]" : "bg-white text-black"} hover:bg-gray-100`}
                style={{ transform: `rotate(${plan.name === "Free" ? "-2deg" : plan.name === "Silver" ? "0deg" : "2deg"})` }}
              >
                {plan.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {plans.map((plan) => (
            <TabsContent key={plan.name} value={plan.name.toLowerCase()}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative bg-white border-4 border-black p-6 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg mx-auto"
                style={{ transform: `rotate(${plan.name === "Free" ? "-2deg" : plan.name === "Silver" ? "0deg" : "2deg"})` }}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <Badge
                  className="absolute -top-4 -right-4 px-4 py-1 text-white border-2 border-black transform rotate-10"
                  style={{ backgroundColor: plan.badgeColor }}
                >
                  {plan.badge}
                </Badge>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-black">{plan.price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={plan.progress} className="mb-4 h-2" style={{ backgroundColor: COLORS.light, color: plan.badgeColor }} />
                  <ul className="text-lg mb-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="mr-2 text-green-500" size={20} />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{feature.name}: {feature.value}</TooltipTrigger>
                            <TooltipContent>{feature.tooltip}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm border-t-2 border-black pt-2">{plan.description}</p>
                  <motion.div
                    animate={{ scale: hoveredPlan === plan.name ? 1.05 : 1 }}
                    className="mt-4"
                  >
                    <Button
                      className="w-full bg-black text-white border-4 border-black px-6 py-3 text-lg font-bold shadow-[6px_6px_0px_0px_rgba(78,205,196,1)] hover:shadow-[8px_8px_0px_0px_rgba(78,205,196,1)]"
                      onClick={() => {
                        triggerConfetti();
                        window.location.href = `/signup?plan=${plan.name.toLowerCase()}`;
                      }}
                    >
                      Choose {plan.name} <Sparkles className="ml-2" />
                    </Button>
                  </motion.div>
                </CardContent>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-white border-y-4 border-black">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gray-100 inline-block px-4 py-2 border-4 border-black transform rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Compare Plans
        </h2>
        <div className="max-w-5xl mx-auto">
          <Table className="border-4 border-black">
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="text-lg font-bold border-2 border-black">Feature</TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.name} className="text-lg font-bold border-2 border-black">{plan.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans[0].features.map((feature, index) => (
                <TableRow key={index}>
                  <TableCell className="font-bold border-2 border-black">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{feature.name}</TooltipTrigger>
                        <TooltipContent>{feature.tooltip}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.name} className="border-2 border-black">{plan.features[index].value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-16 px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-white inline-block px-4 py-2 border-4 border-black transform -rotate-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          What Our Users Say
        </h2>
        <div className="flex flex-wrap justify-center gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className={`relative w-full md:w-80 bg-white border-4 border-black transform ${index % 2 === 0 ? "-rotate-2" : "rotate-2"} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
              style={{ boxShadow: `8px 8px 0px ${plans.find(p => p.name === testimonial.plan).shadowColor}` }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{testimonial.name}, {testimonial.plan} Member</CardTitle>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="text-yellow-400 fill-current" size={20} />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{testimonial.quote}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white border-y-4 border-black">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gray-100 inline-block px-4 py-2 border-4 border-black transform rotate-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          Got Questions?
        </h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="border-4 border-black bg-gray-100">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b-2 border-black">
                <AccordionTrigger className="text-lg font-bold px-4 py-3 hover:bg-gray-200">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 text-lg">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FF6B6B" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v4h-4v2h4v4h2v-4h4v-2h-4V0h-2zM6 34v4h4v-4h2v-4h-2v-4H6v4H2v2h4zm0-30v4H2v2h4v4h2V6h4V4H8V0H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')` }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h2 className="text-4xl font-bold mb-6 bg-white inline-block px-4 py-2 border-4 border-black transform -rotate-3 shadow-[8px_8px_0px_0px_rgba(255,107,107,1)]">
            Ready to Ignite Your Vibe?
          </h2>
          <p className="text-xl mb-8 text-gray-800 max-w-xl mx-auto">
            Upgrade to Silver or Gold and connect with your perfect match faster!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="bg-black text-white border-4 border-black px-6 py-3 text-lg font-bold shadow-[6px_6px_0px_0px_rgba(78,205,196,1)] hover:shadow-[8px_8px_0px_0px_rgba(78,205,196,1)]"
              onClick={() => {
                triggerConfetti();
                window.location.href = `/signup?plan=${selectedPlan}`;
              }}
            >
              Start Sparking Now <Sparkles className="ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 bg-white border-t-4 border-black">
        <p className="text-lg text-gray-800">
          SparkVibe © 2025 | Ignite Your Connections
        </p>
      </footer>

      {/* Inline Styles */}
      <style jsx>{`
        body {
          font-family: 'IBM Plex Mono', monospace;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;