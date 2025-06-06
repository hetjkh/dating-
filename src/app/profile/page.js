"use client";
import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

const ProfileQuestionnaire = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [insights, setInsights] = useState("");
  const [activeSection, setActiveSection] = useState(null); // For accordion
  const [editingSection, setEditingSection] = useState(null); // For edit mode
  const [editingAnswers, setEditingAnswers] = useState({}); // Temporary answers during edit
  const [lightboxImage, setLightboxImage] = useState(null); // For image lightbox
  const [avatarPreview, setAvatarPreview] = useState(null); // For avatar preview
  const [imagesPreview, setImagesPreview] = useState([]); // For images preview

  const COLORS = {
    primary: "#FF6B6B",
    secondary: "#4ECDC4",
    accent1: "#FFE66D",
    accent2: "#1A535C",
    accent3: "#F4A261",
    dark: "#2B2D42",
    light: "#F7FFF7",
  };

  const GEMINI_API_KEY = "AIzaSyDNx2mtOjxSDwZJZYX0qy5xd1siB55OQY8"; // Replace with your actual key

  const sections = [
    {
      title: "THE BASICS",
      emoji: "📌",
      description: "Let's start with who you are",
      icon: "📝",
      questions: [
        {
          id: "nickname",
          question: "WHAT'S YOUR NICKNAME?",
          type: "text",
          placeholder: "What your crew calls you",
          required: true,
          hints: ["Biscuit - my dog named me", "Chaos - self-explanatory", "MJ - initials, not Jordan"],
        },
        {
          id: "age",
          question: "HOW OLD ARE YOU?",
          type: "number",
          placeholder: "18 or older",
          required: true,
          min: 18,
        },
        {
          id: "genderPreference",
          question: "WHO DO YOU WANNA DATE?",
          type: "singleChoice",
          options: [
            { value: "male", label: "MEN", emoji: "👨" },
            { value: "women", label: "WOMEN", emoji: "👩" },
            { value: "both", label: "BOTH", emoji: "✨" },
          ],
          required: true,
        },
        {
          id: "yourGender",
          question: "WHAT IS YOUR GENDER?",
          type: "singleChoice",
          options: [
            { value: "male", label: "GUYS WHO CAN LIFT STUFF", emoji: "👨" },
            { value: "woman", label: "GALS WHO STEAL YOUR FRIES", emoji: "👩" },
          ],
          required: true,
        },
        {
          id: "introExtro",
          question: "AT A PARTY, YOU’RE:",
          type: "singleChoice",
          options: [
            { value: "wallflower", label: "CHILLING WITH THE PETS", emoji: "🐕" },
            { value: "selective", label: "ONE DEEP CHAT", emoji: "🗣️" },
            { value: "mingler", label: "WORKING THE ROOM", emoji: "🦋" },
            { value: "center", label: "PARTY’S MAIN EVENT", emoji: "🎉" },
          ],
          required: true,
        },
      ],
    },
    {
      title: "PERSONALITY PUZZLE",
      emoji: "🧩",
      description: "What makes you tick",
      icon: "🧠",
      questions: [
        {
          id: "secretObsession",
          question: "YOUR SECRET OBSESSION IS:",
          type: "text",
          placeholder: "Guilty pleasure or weird app",
          required: true,
          hints: ["Re-watching The Office forever", "Candy Crush at 3 AM", "Collecting funky socks"],
        },
        {
          id: "conversationStarter",
          question: "YOU BREAK THE ICE WITH:",
          type: "singleChoice",
          options: [
            { value: "conspiracy", label: "WILD THEORY TIME", emoji: "👽" },
            { value: "compliment", label: "SWEET COMPLIMENT", emoji: "✨" },
            { value: "question", label: "RANDOM WEIRD Q", emoji: "💭" },
            { value: "joke", label: "DAD JOKE DROP", emoji: "🤣" },
          ],
        },
        {
          id: "decisionMaking",
          question: "BIG CHOICES, YOU GO WITH:",
          type: "singleChoice",
          options: [
            { value: "gut", label: "VIBES ONLY", emoji: "🔮" },
            { value: "logic", label: "PROS AND CONS", emoji: "📊" },
            { value: "coin", label: "COIN FLIP YOLO", emoji: "🎲" },
            { value: "none", label: "NO IDEA, HELP", emoji: "🤷" },
          ],
        },
      ],
    },
    {
      title: "LIFESTYLE VIBES",
      emoji: "🌀",
      description: "Your daily chaos",
      icon: "📺",
      questions: [
        {
          id: "kitchenSkill",
          question: "YOUR KITCHEN GAME IS:",
          type: "singleChoice",
          options: [
            { value: "chef", label: "MASTER CHEF VIBES", emoji: "👨‍🍳" },
            { value: "basics", label: "I CAN COOK OKAY", emoji: "🍳" },
            { value: "disaster", label: "BURNT TOAST CHAMP", emoji: "🔥" },
            { value: "none", label: "DOES DOORDASH COUNT?", emoji: "🥡" },
          ],
        },
        {
          id: "weekdayNight",
          question: "TUESDAY NIGHT YOU’RE:",
          type: "singleChoice",
          options: [
            { value: "hobby", label: "HOBBY OBSESSION", emoji: "🎨" },
            { value: "streaming", label: "NETFLIX LOOP", emoji: "📺" },
            { value: "socializing", label: "OUT SOMEHOW??", emoji: "🍸" },
            { value: "sleeping", label: "ASLEEP BY 9", emoji: "😴" },
          ],
        },
        {
          id: "weekendVibe",
          question: "YOUR WEEKEND ENERGY IS:",
          type: "singleChoice",
          options: [
            { value: "adventure", label: "ROAD TRIP READY", emoji: "🚗" },
            { value: "chill", label: "COUCH MARATHON", emoji: "🛋️" },
            { value: "social", label: "BRUNCH SQUAD", emoji: "🥐" },
            { value: "none", label: "NO PLANS, WING IT", emoji: "🤷" },
          ],
        },
      ],
    },
    {
      title: "LOVE & CHAOS",
      emoji: "💘",
      description: "How you roll in romance",
      icon: "💌",
      questions: [
        {
          id: "dealbreaker",
          question: "YOUR DATING DEALBREAKER IS:",
          type: "text",
          placeholder: "No socks with sandals, etc.",
          required: true,
          hints: ["Obsessed with their ex", "Hates dogs, instant no", "Chews with mouth open"],
        },
        {
          id: "firstDateEnergy",
          question: "FIRST DATE YOU BRING:",
          type: "singleChoice",
          options: [
            { value: "chill", label: "LAID-BACK VIBES", emoji: "😎" },
            { value: "flirty", label: "FULL CHARM MODE", emoji: "😘" },
            { value: "awkward", label: "ADORABLE AWKWARDNESS", emoji: "😅" },
            { value: "wild", label: "CHAOTIC ENERGY", emoji: "🎉" },
          ],
        },
        {
          id: "argueStyle",
          question: "WHEN YOU ARGUE, YOU:",
          type: "singleChoice",
          options: [
            { value: "diplomatic", label: "CALM TALK IT OUT", emoji: "🧠" },
            { value: "passionate", label: "HEATED THEN HUG", emoji: "🔥" },
            { value: "silent", label: "QUIET THEN DEEP", emoji: "😶" },
            { value: "none", label: "AVOID IT ALL", emoji: "🏃" },
          ],
          required: true,
        },
        {
          id: "idealDate",
          question: "YOUR IDEAL DATE NIGHT:",
          type: "text",
          placeholder: "No word limit, go wild",
          required: true,
          hints: ["Pizza and stargazing", "Karaoke chaos all night", "Hiking then cozy movie"],
        },
      ],
    },
    {
      title: "WILD CARD",
      emoji: "🃏",
      description: "Your random spice",
      icon: "🎲",
      questions: [
        {
          id: "uselessTalent",
          question: "YOUR WEIRDEST TALENT:",
          type: "text",
          placeholder: "Impress us",
          required: true,
          hints: ["Whistling with my nose", "Juggling socks badly", "Mimicking cartoon voices"],
        },
        {
          id: "apocalypseRole",
          question: "ZOMBIE APOCALYPSE YOU’RE:",
          type: "singleChoice",
          options: [
            { value: "dies-first", label: "FIRST TO GO", emoji: "💀" },
            { value: "survivalist", label: "BUNKER BOSS", emoji: "🏠" },
            { value: "leader", label: "TEAM CAPTAIN", emoji: "👑" },
            { value: "joker", label: "BAD JOKE HERO", emoji: "🃏" },
          ],
        },
        {
          id: "deepestFear",
          question: "DUMBEST FEAR YOU HAVE:",
          type: "text",
          placeholder: "Wrong answers only",
          required: true,
          hints: ["Running out of snacks", "Socks getting wet", "Clowns in my closet"],
        },
        {
          id: "favoriteMovie",
          question: "YOUR GO-TO MOVIE?",
          type: "text",
          placeholder: "No judgment",
          required: true,
          hints: ["The Matrix", "Clueless", "Shrek"],
        },
        {
          id: "favoriteMusic",
          question: "WHAT’S YOUR JAM?",
          type: "text",
          placeholder: "Genre or artist",
          required: true,
          hints: ["Indie rock", "Taylor Swift", "Lo-fi beats"],
        },
      ],
    },
    {
      title: "SHOW YOURSELF",
      emoji: "📸",
      description: "Upload a profile avatar and 4-7 pics that scream YOU",
      icon: "🖼️",
      questions: [
        {
          id: "avatar",
          question: "YOUR PROFILE AVATAR (optional)",
          type: "file",
          required: false,
          multiple: false,
          accept: "image/*",
          max: 1,
        },
        {
          id: "images",
          question: "DROP YOUR PICS HERE (optional if editing)",
          type: "file",
          required: false,
          multiple: true,
          accept: "image/*",
          min: 4,
          max: 7,
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("https://dating-backend-1h4q.onrender.com/user/profile", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.profileCompleted) {
          setProfileData(data);
          setAnswers(data);
          setAvatarPreview(data.avatar);
          setImagesPreview(data.images || []);
          generateInsights(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const generateInsights = async (profile) => {
    try {
      const prompt = `
        Analyze the following dating profile choices and provide a summary of the person's personality, vibe, and what type of person they might be. Be creative, fun, and insightful:
        ${JSON.stringify({ ...profile, images: undefined, avatar: undefined }, null, 2)}
        Provide a response in natural language, focusing on their social energy, romantic style, quirks, and overall vibe.
      `;
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      const insightText = data.candidates[0].content.parts[0].text;
      setInsights(insightText);
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights("Couldn’t vibe-check you right now—tech gremlins at work!");
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      colors: [COLORS.primary, COLORS.secondary, COLORS.accent1],
    });
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
    if (questionId === "avatar" && value) {
      setAvatarPreview(URL.createObjectURL(value));
    } else if (questionId === "images" && value) {
      setImagesPreview(value.map(file => URL.createObjectURL(file)));
    }
  };

  const handleEditAnswerChange = (questionId, value) => {
    setEditingAnswers({ ...editingAnswers, [questionId]: value });
    if (questionId === "avatar" && value) {
      setAvatarPreview(URL.createObjectURL(value));
    } else if (questionId === "images" && value) {
      setImagesPreview(value.map(file => URL.createObjectURL(file)));
    }
  };

  const startEditing = (sectionIndex) => {
    setEditingSection(sectionIndex);
    setEditingAnswers({ ...profileData }); // Initialize with current profile data
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingAnswers({});
    setAvatarPreview(profileData?.avatar);
    setImagesPreview(profileData?.images || []);
  };

  const saveEditing = async (sectionIndex) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(editingAnswers).forEach((key) => {
        if (key === "images" && editingAnswers[key]) {
          editingAnswers[key].forEach((file, index) => {
            formData.append("images", file);
          });
        } else if (key === "avatar" && editingAnswers[key]) {
          formData.append("avatar", editingAnswers[key]);
        } else if (key !== "images" && key !== "avatar") {
          formData.append(key, Array.isArray(editingAnswers[key]) ? JSON.stringify(editingAnswers[key]) : editingAnswers[key]);
        }
      });

      const response = await fetch("https://dating-backend-1h4q.onrender.com/user/profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfileData({
          ...editingAnswers,
          avatar: updatedProfile.profile.avatar || profileData?.avatar,
          images: editingAnswers.images ? updatedProfile.profile.images : profileData?.images,
          profileCompleted: true,
        });
        setAnswers(editingAnswers);
        setAvatarPreview(updatedProfile.profile.avatar || profileData?.avatar);
        setImagesPreview(editingAnswers.images ? updatedProfile.profile.images : profileData?.images || []);
        generateInsights(editingAnswers);
        setEditingSection(null);
        setEditingAnswers({});
        triggerConfetti();
      } else {
        console.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSectionData = sections[currentSection];
  const currentQuestionData = currentSectionData?.questions[currentQuestion];

  const nextQuestion = () => {
    if (currentQuestionData.required && !answers[currentQuestionData.id] && !profileData?.[currentQuestionData.id]) return;
    if (
      currentQuestionData.type === "file" &&
      currentQuestionData.multiple &&
      answers[currentQuestionData.id] &&
      (answers[currentQuestionData.id].length < currentQuestionData.min || answers[currentQuestionData.id].length > currentQuestionData.max)
    ) return;
    if (currentQuestion < currentSectionData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowHints(false);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
      setShowHints(false);
    } else {
      submitAnswers();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowHints(false);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(sections[currentSection - 1].questions.length - 1);
      setShowHints(false);
    }
  };

  const submitAnswers = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(answers).forEach((key) => {
        if (key === "images" && answers[key]) {
          answers[key].forEach((file, index) => {
            formData.append("images", file);
          });
        } else if (key === "avatar" && answers[key]) {
          formData.append("avatar", answers[key]);
        } else if (key !== "images" && key !== "avatar") {
          formData.append(key, Array.isArray(answers[key]) ? JSON.stringify(answers[key]) : answers[key]);
        }
      });

      const response = await fetch("https://dating-backend-1h4q.onrender.com/user/profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (response.ok) {
        setCompleted(true);
        const updatedProfile = await response.json();
        setProfileData({
          ...answers,
          avatar: updatedProfile.profile.avatar || profileData?.avatar,
          images: answers.images ? updatedProfile.profile.images : profileData?.images,
          profileCompleted: true,
        });
        setAvatarPreview(updatedProfile.profile.avatar || profileData?.avatar);
        setImagesPreview(answers.images ? updatedProfile.profile.images : profileData?.images || []);
        generateInsights(answers);
        triggerConfetti();
      } else {
        console.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestionData) return null;
    switch (currentQuestionData.type) {
      case "text":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <input
              type="text"
              className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold hover:scale-105"
              placeholder={currentQuestionData.placeholder || ""}
              value={answers[currentQuestionData.id] || profileData?.[currentQuestionData.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
              style={{ transform: "rotate(-1deg)" }}
            />
            {currentQuestionData.hints && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 4 }}
                  onClick={() => setShowHints(!showHints)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 border-2 border-black bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  style={{ transform: "rotate(2deg)" }}
                >
                  <span className="text-xl">💡</span>
                </motion.button>
                <AnimatePresence>
                  {showHints && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 p-4 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-bold"
                      style={{ transform: "rotate(1deg)", backgroundColor: COLORS.accent1 }}
                    >
                      <p className="mb-2">Try something like:</p>
                      <ul className="list-disc pl-5">
                        {currentQuestionData.hints.map((hint, index) => (
                          <li key={index} className="mb-1">{hint}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        );
      case "number":
        return (
          <motion.input
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            type="number"
            className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold hover:scale-105"
            placeholder={currentQuestionData.placeholder || ""}
            value={answers[currentQuestionData.id] || profileData?.[currentQuestionData.id] || ""}
            min={currentQuestionData.min}
            onChange={(e) => {
              const value = e.target.value;
              if (value >= currentQuestionData.min) {
                handleAnswerChange(currentQuestionData.id, value);
              }
            }}
            style={{ transform: "rotate(-1deg)" }}
          />
        );
      case "singleChoice":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-4 w-full"
          >
            {currentQuestionData.options.map((option, index) => {
              const isSelected = (answers[currentQuestionData.id] || profileData?.[currentQuestionData.id]) === option.value;
              const rotations = ["-1deg", "1deg", "-0.5deg", "0.5deg", "0deg"];
              const bgColors = [COLORS.primary, COLORS.secondary, COLORS.accent1, COLORS.accent3, COLORS.light];
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center p-5 text-left transition-all border-4 border-black font-bold ${
                    isSelected ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-y-[-4px]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                  onClick={() => handleAnswerChange(currentQuestionData.id, option.value)}
                  style={{
                    transform: `rotate(${rotations[index % rotations.length]})`,
                    backgroundColor: isSelected ? "#000000" : bgColors[index % bgColors.length],
                    color: isSelected ? "#ffffff" : "#000000",
                  }}
                >
                  {option.emoji && <span className="text-2xl mr-3">{option.emoji}</span>}
                  <span className="text-lg">{option.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        );
      case "multiSelect":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-4 w-full"
          >
            {currentQuestionData.options.map((option, index) => {
              const isSelected = (answers[currentQuestionData.id] || profileData?.[currentQuestionData.id] || []).includes(option.value);
              const rotations = ["-1deg", "1deg", "-0.5deg", "0.5deg", "0deg"];
              const bgColors = [COLORS.primary, COLORS.secondary, COLORS.accent1, COLORS.accent3, COLORS.light];
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center p-5 text-left transition-all border-4 border-black font-bold ${
                    isSelected ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-y-[-4px]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                  onClick={() => {
                    const currentValues = answers[currentQuestionData.id] || profileData?.[currentQuestionData.id] || [];
                    const newValues = isSelected
                      ? currentValues.filter((v) => v !== option.value)
                      : [...currentValues, option.value];
                    handleAnswerChange(currentQuestionData.id, newValues);
                  }}
                  style={{
                    transform: `rotate(${rotations[index % rotations.length]})`,
                    backgroundColor: isSelected ? "#000000" : bgColors[index % bgColors.length],
                    color: isSelected ? "#ffffff" : "#000000",
                  }}
                >
                  {option.emoji && <span className="text-2xl mr-3">{option.emoji}</span>}
                  <span className="text-lg">{option.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        );
      case "file":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <input
              type="file"
              multiple={currentQuestionData.multiple}
              accept={currentQuestionData.accept}
              className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold hover:scale-105"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (currentQuestionData.multiple) {
                  if (files.length < currentQuestionData.min || files.length > currentQuestionData.max) {
                    alert(`Please upload between ${currentQuestionData.min} and ${currentQuestionData.max} images!`);
                    return;
                  }
                } else if (files.length > currentQuestionData.max) {
                  alert("Please upload only one avatar image!");
                  return;
                }
                handleAnswerChange(currentQuestionData.id, currentQuestionData.multiple ? files : files[0]);
              }}
              style={{ transform: "rotate(-1deg)" }}
            />
            <p className="mt-2 text-sm font-bold">
              Uploaded: {currentQuestionData.multiple ? (answers[currentQuestionData.id]?.length || 0) : answers[currentQuestionData.id] ? 1 : 0}/{currentQuestionData.max}
            </p>
            {currentQuestionData.id === "avatar" && (avatarPreview || profileData?.avatar) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <p className="text-sm font-bold">Avatar Preview:</p>
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={avatarPreview || profileData.avatar}
                  alt="Avatar preview"
                  className="w-32 h-32 object-cover border-2 border-black rounded-full cursor-pointer"
                  onClick={() => setLightboxImage(avatarPreview || profileData.avatar)}
                />
              </motion.div>
            )}
            {currentQuestionData.id === "images" && (imagesPreview.length > 0 || profileData?.images) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <p className="text-sm font-bold">Images Preview:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(imagesPreview.length > 0 ? imagesPreview : profileData?.images || []).map((url, index) => (
                    <motion.img
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      src={url}
                      alt={`Image preview ${index + 1}`}
                      className="w-full h-16 object-cover border-2 border-black cursor-pointer"
                      onClick={() => setLightboxImage(url)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderProfileView = () => {
    if (!profileData) return null;

    return (
      
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-6 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2
              className="text-5xl font-black uppercase tracking-tighter"
              style={{ color: COLORS.dark, textShadow: `4px 4px 0 ${COLORS.primary}` }}
            >
              YOUR PROFILE
            </h2>
            <div className="mt-2 h-2 bg-black" style={{ width: "100px" }}></div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar and Images */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div
                className="bg-white border-4 border-black p-4"
                style={{ boxShadow: "8px 8px 0px rgba(0,0,0,1)" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black uppercase" style={{ color: COLORS.accent2 }}>
                    AVATAR
                  </h3>
                  {editingSection !== sections.length - 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startEditing(sections.length - 1)}
                      className="px-4 py-2 font-black uppercase tracking-tight border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                      style={{ transform: "rotate(2deg)" }}
                    >
                      EDIT ✏️
                    </motion.button>
                  )}
                </div>
                {editingSection === sections.length - 1 ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold hover:scale-105"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleEditAnswerChange("avatar", file);
                        }
                      }}
                      style={{ transform: "rotate(-1deg)" }}
                    />
                    {avatarPreview && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <p className="text-sm font-bold">Avatar Preview:</p>
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-32 h-32 object-cover border-2 border-black rounded-full cursor-pointer"
                          onClick={() => setLightboxImage(avatarPreview)}
                        />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  profileData.avatar && (
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={profileData.avatar}
                      alt="Profile avatar"
                      className="w-40 h-40 object-cover border-2 border-black rounded-full cursor-pointer"
                      onClick={() => setLightboxImage(profileData.avatar)}
                    />
                  )
                )}
              </div>
              <div
                className="bg-white border-4 border-black p-4"
                style={{ boxShadow: "8px 8px 0px rgba(0,0,0,1)" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black uppercase" style={{ color: COLORS.accent2 }}>
                    PICS
                  </h3>
                  {editingSection !== sections.length - 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startEditing(sections.length - 1)}
                      className="px-4 py-2 font-black uppercase tracking-tight border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                      style={{ transform: "rotate(2deg)" }}
                    >
                      EDIT ✏️
                    </motion.button>
                  )}
                </div>
                {editingSection === sections.length - 1 ? (
                  <div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold hover:scale-105"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        if (files.length < 4 || files.length > 7) {
                          alert("Please upload between 4 and 7 images!");
                          return;
                        }
                        handleEditAnswerChange("images", files);
                      }}
                      style={{ transform: "rotate(-1deg)" }}
                    />
                    <p className="mt-2 text-sm font-bold">
                      Uploaded: {imagesPreview.length}/7
                    </p>
                    {imagesPreview.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <p className="text-sm font-bold">Images Preview:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {imagesPreview.map((url, index) => (
                            <motion.img
                              key={index}
                              whileHover={{ scale: 1.1 }}
                              src={url}
                              alt={`Image preview ${index + 1}`}
                              className="w-full h-16 object-cover border-2 border-black cursor-pointer"
                              onClick={() => setLightboxImage(url)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  profileData.images && (
                    <div className="grid grid-cols-2 gap-2">
                      {profileData.images.map((url, index) => (
                        <motion.img
                          key={index}
                          whileHover={{ scale: 1.1 }}
                          src={url}
                          alt={`Profile pic ${index + 1}`}
                          className="w-full h-24 object-cover border-2 border-black cursor-pointer"
                          onClick={() => setLightboxImage(url)}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
              {editingSection === sections.length - 1 && (
                <div className="flex justify-between mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelEditing}
                    className="px-6 py-3 font-black uppercase tracking-tight border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                    style={{ transform: "rotate(-1deg)" }}
                  >
                    CANCEL
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => saveEditing(sections.length - 1)}
                    disabled={loading}
                    className={`px-6 py-3 font-black uppercase tracking-tight border-4 border-black ${
                      loading
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none"
                        : "bg-black text-white shadow-[4px_4px_0px_0px_rgba(78,205,196,1)] hover:shadow-[6px_6px_0px_0px_rgba(78,205,196,1)] hover:translate-y-[-2px] transition-all"
                    }`}
                    style={{ transform: "rotate(1deg)" }}
                  >
                    {loading ? "SAVING..." : "SAVE"}
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Profile Details with Accordion */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-2 space-y-4"
            >
              {sections.slice(0, -1).map((section, idx) => (
                <div
                  key={idx}
                  className="bg-white border-4 border-black"
                  style={{ boxShadow: "8px 8px 0px rgba(0,0,0,1)", backgroundColor: COLORS.light }}
                >
                  <motion.div
                    className="w-full flex justify-between items-center p-6"
                    style={{ color: COLORS[idx % 5] }}
                  >
                    <button
                      onClick={() => setActiveSection(activeSection === idx ? null : idx)}
                      className="text-left flex-1"
                    >
                      <h3 className="text-2xl font-black uppercase">
                        {section.icon} {section.title}
                      </h3>
                    </button>
                    {editingSection !== idx && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startEditing(idx)}
                        className="px-4 py-2 font-black uppercase tracking-tight border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                        style={{ transform: "rotate(2deg)" }}
                      >
                        EDIT ✏️
                      </motion.button>
                    )}
                    <button
                      onClick={() => setActiveSection(activeSection === idx ? null : idx)}
                      className="ml-4"
                    >
                      <span className="text-xl">{activeSection === idx ? "▼" : "▶"}</span>
                    </button>
                  </motion.div>
                  <AnimatePresence>
                    {activeSection === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 space-y-4"
                      >
                        {section.questions.map((question) => {
                          const answer = editingSection === idx ? editingAnswers[question.id] : profileData[question.id];
                          if (!answer && question.id !== "avatar" && question.id !== "images") return null;

                          let displayAnswer;
                          if (question.type === "text" || question.type === "number") {
                            displayAnswer = answer;
                          } else if (question.type === "multiSelect") {
                            displayAnswer = question.options
                              .filter((opt) => answer?.includes(opt.value))
                              .map((opt) => `${opt.emoji} ${opt.label}`)
                              .join(", ");
                          } else if (question.type === "singleChoice") {
                            displayAnswer = question.options.find((opt) => opt.value === answer)?.label || answer;
                          } else {
                            displayAnswer = answer;
                          }

                          return (
                            <div key={question.id} className="flex flex-col">
                              <span className="text-sm font-black uppercase" style={{ color: COLORS.dark }}>
                                {question.question}
                              </span>
                              {editingSection === idx ? (
                                question.type === "text" ? (
                                  <input
                                    type="text"
                                    className="w-full p-3 text-lg bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                                    placeholder={question.placeholder || ""}
                                    value={editingAnswers[question.id] || ""}
                                    onChange={(e) => handleEditAnswerChange(question.id, e.target.value)}
                                  />
                                ) : question.type === "number" ? (
                                  <input
                                    type="number"
                                    className="w-full p-3 text-lg bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                                    placeholder={question.placeholder || ""}
                                    value={editingAnswers[question.id] || ""}
                                    min={question.min}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (!question.min || value >= question.min) {
                                        handleEditAnswerChange(question.id, value);
                                      }
                                    }}
                                  />
                                ) : question.type === "singleChoice" ? (
                                  <select
                                    className="w-full p-3 text-lg bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                                    value={editingAnswers[question.id] || ""}
                                    onChange={(e) => handleEditAnswerChange(question.id, e.target.value)}
                                  >
                                    <option value="" disabled>Select an option</option>
                                    {question.options.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.emoji} {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : question.type === "multiSelect" ? (
                                  <select
                                    multiple
                                    className="w-full p-3 text-lg bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                                    value={editingAnswers[question.id] || []}
                                    onChange={(e) => {
                                      const values = Array.from(e.target.selectedOptions, (option) => option.value);
                                      handleEditAnswerChange(question.id, values);
                                    }}
                                  >
                                    {question.options.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.emoji} {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-lg font-bold" style={{ color: COLORS.accent2 }}>
                                    {displayAnswer || "Not answered"}
                                  </span>
                                )
                              ) : (
                                <span className="text-lg font-bold" style={{ color: COLORS.accent2 }}>
                                  {displayAnswer || "Not answered"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {editingSection === idx && (
                          <div className="flex justify-between mt-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={cancelEditing}
                              className="px-6 py-3 font-black uppercase tracking-tight border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                              style={{ transform: "rotate(-1deg)" }}
                            >
                              CANCEL
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => saveEditing(idx)}
                              disabled={loading || section.questions.some(q => q.required && !editingAnswers[q.id])}
                              className={`px-6 py-3 font-black uppercase tracking-tight border-4 border-black ${
                                loading || section.questions.some(q => q.required && !editingAnswers[q.id])
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none"
                                  : "bg-black text-white shadow-[4px_4px_0px_0px_rgba(78,205,196,1)] hover:shadow-[6px_6px_0px_0px_rgba(78,205,196,1)] hover:translate-y-[-2px] transition-all"
                              }`}
                              style={{ transform: "rotate(1deg)" }}
                            >
                              {loading ? "SAVING..." : "SAVE"}
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full bg-black text-white py-4 px-6 text-xl font-black uppercase tracking-tight border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,107,107,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,107,107,1)] hover:translate-y-[-4px] transition-all"
                style={{ transform: "rotate(1deg)" }}
              >
                GO TO DASHBOARD ✨
              </motion.button>
            </motion.div>
            </motion.div>
          </div>
        </div>
        {/* Lightbox for Images */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={() => setLightboxImage(null)}
            >
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                src={lightboxImage}
                alt="Lightbox image"
                className="max-w-[90%] max-h-[90%] object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (isFetching) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center"
      >
        <p className="text-2xl font-black">LOADING YOUR VIBE...</p>
      </motion.div>
    );
  }

  if (completed || (profileData && profileData.profileCompleted)) {
    return profileData ? (
      renderProfileView()
    ) : (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-white"
      >
        <div
          className="max-w-md w-full mx-auto bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ backgroundColor: COLORS.accent1, transform: "rotate(-1deg)" }}
        >
          <div className="text-7xl mb-4">🎉</div>
          <h2
            className="text-4xl font-black text-black mb-4 uppercase tracking-tight"
            style={{ textShadow: "3px 3px 0 #FF6B6B" }}
          >
            YOU’RE IN!
          </h2>
          <p className="text-xl text-black mb-6 font-bold">
            Your vibe is officially on the map. Time to meet your match!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-black text-white py-4 px-6 text-xl font-black uppercase tracking-tight border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,107,107,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,107,107,1)] hover:translate-y-[-4px] transition-all"
          >
            MEET YOUR PEOPLE! ✨
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white p-4 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-4 p-3 border-4 border-black font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{
            backgroundColor:
              currentSection === 0 ? COLORS.primary :
              currentSection === 1 ? COLORS.secondary :
              currentSection === 2 ? COLORS.accent1 :
              currentSection === 3 ? COLORS.accent3 :
              currentSection === 4 ? COLORS.accent2 :
              COLORS.light,
            transform: "rotate(-1deg)",
          }}
        >
          {currentSectionData.icon} {currentSectionData.title}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border-4 border-black h-6 mb-6 overflow-hidden"
        >
          <motion.div
            className="h-full transition-all duration-500"
            style={{
              width: `${((currentSection * 100) / sections.length) +
                ((currentQuestion * 100) / (sections.length * currentSectionData.questions.length))}%`,
              backgroundColor: "#000000",
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.2) 10px, rgba(255,255,255,.2) 20px)`,
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white border-4 border-black p-6 md:p-8 mb-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          style={{ transform: "rotate(1deg)" }}
        >
          <div className="mb-8">
            <h3 className="text-2xl font-black text-black mb-6 uppercase">
              {currentQuestionData.question}
            </h3>
            <div className="mt-6">{renderQuestion()}</div>
          </div>

          <div className="flex justify-between mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevQuestion}
              disabled={currentSection === 0 && currentQuestion === 0}
              className={`px-6 py-3 font-black uppercase tracking-tight border-4 border-black ${
                currentSection === 0 && currentQuestion === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
              }`}
              style={{ transform: "rotate(-1deg)" }}
            >
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextQuestion}
              disabled={
                (currentQuestionData.required && !answers[currentQuestionData.id] && !profileData?.[currentQuestionData.id]) ||
                (currentQuestionData.type === "file" && currentQuestionData.multiple && answers[currentQuestionData.id] && (answers[currentQuestionData.id].length < currentQuestionData.min || answers[currentQuestionData.id].length > currentQuestionData.max))
              }
              className={`px-6 py-3 font-black uppercase tracking-tight border-4 border-black ${
                (currentQuestionData.required && !answers[currentQuestionData.id] && !profileData?.[currentQuestionData.id]) ||
                (currentQuestionData.type === "file" && currentQuestionData.multiple && answers[currentQuestionData.id] && (answers[currentQuestionData.id].length < currentQuestionData.min || answers[currentQuestionData.id].length > currentQuestionData.max))
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none"
                  : "bg-black text-white shadow-[4px_4px_0px_0px_rgba(78,205,196,1)] hover:shadow-[6px_6px_0px_0px_rgba(78,205,196,1)] hover:translate-y-[-2px] transition-all"
              }`}
              style={{ transform: "rotate(1deg)" }}
            >
              {currentSection === sections.length - 1 && currentQuestion === currentSectionData.questions.length - 1
                ? loading
                  ? "SAVING..."
                  : "FINISH"
                : "NEXT"}
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-8 inline-block py-1 px-3 font-black text-sm border-2 border-black"
            style={{ backgroundColor: COLORS.accent1, transform: "rotate(-2deg)" }}
          >
            {currentQuestion + 1}/{currentSectionData.questions.length}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileQuestionnaire;