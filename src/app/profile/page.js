"use client";
import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";

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
            { value: "men", label: "MEN", emoji: "👨" },
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
            { value: "female", label: "GALS WHO STEAL YOUR FRIES", emoji: "👩" },
            { value: "non-binary", label: "PEOPLE BEYOND THE BINARY", emoji: "✨" },
            { value: "all", label: "ANYONE FUN, SURPRISE ME", emoji: "🎲" },
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
      description: "Upload 4-7 pics that scream YOU",
      icon: "🖼️",
      questions: [
        {
          id: "images",
          question: "DROP YOUR PICS HERE (optional if editing)",
          type: "file",
          required: false, // Not required when editing
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
        const response = await fetch("https://dating-backend.onrender.comser/profile", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.profileCompleted) {
          setProfileData(data);
          setAnswers(data);
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
        ${JSON.stringify({ ...profile, images: undefined }, null, 2)}
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
  };

  const currentSectionData = sections[currentSection];
  const currentQuestionData = currentSectionData?.questions[currentQuestion];

  const nextQuestion = () => {
    if (currentQuestionData.required && !answers[currentQuestionData.id] && !profileData?.[currentQuestionData.id]) return;
    if (
      currentQuestionData.type === "file" &&
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
        } else if (key !== "images") {
          formData.append(key, Array.isArray(answers[key]) ? JSON.stringify(answers[key]) : answers[key]);
        }
      });

      const response = await fetch("https://dating-backend.onrender.com/user/profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (response.ok) {
        setCompleted(true);
        const updatedProfile = await response.json();
        setProfileData({
          ...answers,
          images: answers.images ? updatedProfile.profile.images : profileData.images,
          profileCompleted: true,
        });
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
          <div className="relative">
            <input
              type="text"
              className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
              placeholder={currentQuestionData.placeholder || ""}
              value={answers[currentQuestionData.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
              style={{ transform: "rotate(-1deg)" }}
            />
            {currentQuestionData.hints && (
              <>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 border-2 border-black bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  style={{ transform: "rotate(2deg)" }}
                >
                  <span className="text-xl">💡</span>
                </button>
                {showHints && (
                  <div
                    className="mt-2 p-4 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-bold"
                    style={{ transform: "rotate(1deg)", backgroundColor: COLORS.accent1 }}
                  >
                    <p className="mb-2">Try something like:</p>
                    <ul className="list-disc pl-5">
                      {currentQuestionData.hints.map((hint, index) => (
                        <li key={index} className="mb-1">{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case "number":
        return (
          <input
            type="number"
            className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
            placeholder={currentQuestionData.placeholder || ""}
            value={answers[currentQuestionData.id] || ""}
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
          <div className="grid grid-cols-1 gap-4 w-full">
            {currentQuestionData.options.map((option, index) => {
              const isSelected = answers[currentQuestionData.id] === option.value;
              const rotations = ["-1deg", "1deg", "-0.5deg", "0.5deg", "0deg"];
              const bgColors = [COLORS.primary, COLORS.secondary, COLORS.accent1, COLORS.accent3, COLORS.light];
              return (
                <button
                  key={option.value}
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
                </button>
              );
            })}
          </div>
        );
      case "multiSelect":
        return (
          <div className="grid grid-cols-1 gap-4 w-full">
            {currentQuestionData.options.map((option, index) => {
              const isSelected = (answers[currentQuestionData.id] || []).includes(option.value);
              const rotations = ["-1deg", "1deg", "-0.5deg", "0.5deg", "0deg"];
              const bgColors = [COLORS.primary, COLORS.secondary, COLORS.accent1, COLORS.accent3, COLORS.light];
              return (
                <button
                  key={option.value}
                  className={`flex items-center p-5 text-left transition-all border-4 border-black font-bold ${
                    isSelected ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-y-[-4px]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                  onClick={() => {
                    const currentValues = answers[currentQuestionData.id] || [];
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
                </button>
              );
            })}
          </div>
        );
      case "file":
        return (
          <div className="relative">
            <input
              type="file"
              multiple
              accept={currentQuestionData.accept}
              className="w-full p-5 text-lg bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length < currentQuestionData.min || files.length > currentQuestionData.max) {
                  alert(`Please upload between ${currentQuestionData.min} and ${currentQuestionData.max} images!`);
                  return;
                }
                handleAnswerChange(currentQuestionData.id, files);
              }}
              style={{ transform: "rotate(-1deg)" }}
            />
            <p className="mt-2 text-sm font-bold">
              Uploaded: {(answers[currentQuestionData.id]?.length || 0)}/{currentQuestionData.max}
            </p>
            {profileData?.images && currentSection === sections.length - 1 && (
              <div className="mt-4">
                <p className="text-sm font-bold">Current Images:</p>
                <div className="grid grid-cols-2 gap-2">
                  {profileData.images.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Current pic ${index + 1}`}
                      className="w-full h-16 object-cover border-2 border-black"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderProfileView = () => {
    if (!profileData) return null;

    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className="p-6 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            style={{ transform: "rotate(-2deg)", backgroundColor: COLORS.accent1 }}
          >
            <h3 className="text-3xl font-black mb-4 uppercase tracking-tight" style={{ color: COLORS.dark, textShadow: `2px 2px 0 ${COLORS.primary}` }}>
              🤖 AI VIBE CHECK
            </h3>
            <p className="text-lg font-bold whitespace-pre-wrap" style={{ color: COLORS.dark }}>
              {insights || "Generating your vibe..."}
            </p>
          </div>

          <div className="space-y-6">
            <h2
              className="text-4xl font-black text-black mb-6 uppercase tracking-tight text-center md:text-left"
              style={{ textShadow: `4px 4px 0 ${COLORS.secondary}` }}
            >
              YOUR VIBE 🎨
            </h2>
            {profileData.images && (
              <div
                className="p-5 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                style={{ transform: "rotate(1deg)" }}
              >
                <h3 className="text-xl font-black mb-3 uppercase" style={{ color: COLORS.accent2 }}>
                  📸 YOUR PICS
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {profileData.images.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Profile pic ${index + 1}`}
                      className="w-full h-32 object-cover border-2 border-black"
                      style={{ transform: `rotate(${index % 2 === 0 ? "-1deg" : "1deg"})` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="p-5 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                style={{ transform: `rotate(${idx % 2 === 0 ? "1deg" : "-1deg"})`, backgroundColor: COLORS.light }}
              >
                <h3 className="text-xl font-black mb-3 uppercase" style={{ color: COLORS[idx % 5] }}>
                  {section.icon} {section.title}
                </h3>
                <div className="space-y-2">
                  {section.questions.map((question) => {
                    const answer = profileData[question.id];
                    if (!answer) return null;

                    let displayAnswer;
                    if (question.type === "text" || question.type === "number") {
                      displayAnswer = answer;
                    } else if (question.type === "multiSelect") {
                      displayAnswer = question.options
                        .filter((opt) => answer.includes(opt.value))
                        .map((opt) => `${opt.emoji} ${opt.label}`)
                        .join(", ");
                    } else if (question.type === "singleChoice") {
                      displayAnswer = question.options.find((opt) => opt.value === answer)?.label || answer;
                    } else if (question.type === "file") {
                      displayAnswer = `${answer.length} images uploaded`;
                    } else {
                      displayAnswer = answer;
                    }

                    return (
                      <div key={question.id} className="flex flex-col">
                        <span className="text-sm font-bold text-black uppercase">{question.question}</span>
                        <span className="text-lg" style={{ color: COLORS.dark }}>
                          {displayAnswer || "Not answered"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setProfileData(null);
                setCompleted(false);
                setAnswers(profileData);
                setCurrentSection(0);
                setCurrentQuestion(0);
              }}
              className="w-full bg-black text-white py-3 px-5 text-lg font-black uppercase tracking-tight border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,107,107,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,107,107,1)] hover:translate-y-[-4px] transition-all"
              style={{ transform: "rotate(1deg)" }}
            >
              EDIT YOUR VIBE ✏️
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl font-black">LOADING YOUR VIBE...</p>
      </div>
    );
  }

  if (completed || (profileData && profileData.profileCompleted)) {
    return profileData ? (
      renderProfileView()
    ) : (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
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
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-black text-white py-4 px-6 text-xl font-black uppercase tracking-tight border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,107,107,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,107,107,1)] hover:translate-y-[-4px] transition-all"
          >
            MEET YOUR PEOPLE! ✨
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mb-8">
        <div
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
        </div>

        <div className="bg-white border-4 border-black h-6 mb-6 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((currentSection * 100) / sections.length) +
                ((currentQuestion * 100) / (sections.length * currentSectionData.questions.length))}%`,
              backgroundColor: "#000000",
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.2) 10px, rgba(255,255,255,.2) 20px)`,
            }}
          />
        </div>

        <div
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
            <button
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
            </button>
            <button
              onClick={nextQuestion}
              disabled={
                (currentQuestionData.required && !answers[currentQuestionData.id] && !profileData?.[currentQuestionData.id]) ||
                (currentQuestionData.type === "file" && answers[currentQuestionData.id] && (answers[currentQuestionData.id].length < currentQuestionData.min || answers[currentQuestionData.id].length > currentQuestionData.max))
              }
              className={`px-6 py-3 font-black uppercase tracking-tight border-4 border-black ${
                (currentQuestionData.required && !answers[currentQuestionData.id] && !profileData?.[currentQuestionData.id]) ||
                (currentQuestionData.type === "file" && answers[currentQuestionData.id] && (answers[currentQuestionData.id].length < currentQuestionData.min || answers[currentQuestionData.id].length > currentQuestionData.max))
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
            </button>
          </div>

          <div
            className="mt-8 inline-block py-1 px-3 font-black text-sm border-2 border-black"
            style={{ backgroundColor: COLORS.accent1, transform: "rotate(-2deg)" }}
          >
            {currentQuestion + 1}/{currentSectionData.questions.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileQuestionnaire;
