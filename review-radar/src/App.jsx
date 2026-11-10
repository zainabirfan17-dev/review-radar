import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowRight, 
  Loader2, 
  RefreshCw, 
  Copy, 
  Check, 
  Key, 
  AlertCircle, 
  ShieldCheck, 
  Zap,
  MinusCircle,
  Bot,
  History,
  Trash2,
  Compass
} from 'lucide-react';

// ==========================================
// 1. EXTENDED 5-CATEGORY LOCAL SENTIMENT ENGINE
// ==========================================

function analyzeByKeywords(text) {
  const lower = text.toLowerCase();
  
  const strongPositiveWords = ["incredible", "outstanding", "exceptional", "perfection", "unbelievable", "best ever", "flawless", "superb", "exceeded"];
  const positiveWords = ["great", "excellent", "good", "love", "awesome", "fast", "amazing", "happy", "best", "perfect", "smooth", "helpful", "delighted"];
  
  const strongNegativeWords = ["horrible", "scam", "disaster", "garbage", "unusable", "lawsuit", "furious", "ruined", "refund immediately", "worst ever"];
  const negativeWords = ["bad", "terrible", "worst", "slow", "broken", "hate", "refund", "poor", "useless", "disappointed", "defective", "awful", "late"];

  let score = 0;
  const words = lower.split(/\W+/);

  words.forEach((word) => {
    if (strongPositiveWords.includes(word)) score += 2.5;
    else if (positiveWords.includes(word)) score += 1;

    if (strongNegativeWords.includes(word)) score -= 2.5;
    else if (negativeWords.includes(word)) score -= 1;
  });

  if (score >= 3) {
    return { label: "Strongly Positive", category: "positive", confidence: Math.min(85 + Math.round(score * 3), 99) };
  } else if (score > 0.5) {
    return { label: "Positive", category: "positive", confidence: Math.min(65 + Math.round(score * 8), 92) };
  } else if (score <= -3) {
    return { label: "Strongly Negative", category: "negative", confidence: Math.min(85 + Math.round(Math.abs(score) * 3), 99) };
  } else if (score < -0.5) {
    return { label: "Negative", category: "negative", confidence: Math.min(65 + Math.round(Math.abs(score) * 8), 92) };
  }

  return {
    label: "Neutral",
    category: "neutral",
    confidence: Math.floor(Math.random() * 15) + 70,
  };
}

async function predictSentiment(text) {
  return analyzeByKeywords(text);
}


// ==========================================
// 2. GEMINI API SERVICE WITH AUTOMATED TONE SELECTION
// ==========================================

async function generateAutomatedReply(reviewText, fallbackSentiment, apiKey) {
  const effectiveKey = apiKey || "";
  
  const systemPrompt = `You are an expert customer service AI assistant. 
Your task is to analyze the review text, determine its sentiment, automatically select the single best response tone based on the review's context and severity, and generate a polite automated customer reply.

Tone Matrix Guidelines:
- Strongly Positive / Positive -> Use an "Enthusiastic & Grateful" tone (warm appreciation, brand ambassador welcome, invite to share experience).
- Neutral -> Use a "Professional & Constructive" tone (objective, balanced, asking for specific suggestions to improve).
- Negative / Strongly Negative -> Use an "Empathetic & Solution-Oriented" tone (sincere apology, de-escalation, direct customer support path).
`;

  const userQuery = `Analyze this incoming customer review and generate an automated response:
"${reviewText}"`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          sentimentLabel: { 
            type: "STRING", 
            enum: ["Strongly Positive", "Positive", "Neutral", "Negative", "Strongly Negative"] 
          },
          confidence: { type: "NUMBER" },
          detectedTone: { type: "STRING" },
          toneReasoning: { type: "STRING" },
          explanation: { type: "STRING" },
          automatedReply: { type: "STRING" }
        },
        required: ["sentimentLabel", "confidence", "detectedTone", "toneReasoning", "explanation", "automatedReply"]
      }
    }
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Gemini API HTTP ${response.status}`);

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (textOutput) return JSON.parse(textOutput);
    throw new Error("Invalid output format");
  } catch (err) {
    console.warn("Using simulated AI response fallback:", err);
    await new Promise((r) => setTimeout(r, 600));

    const sentiment = fallbackSentiment;
    let detectedTone = "Professional & Constructive";
    let toneReasoning = "Neutral sentiment detected. Selected a balanced, professional tone to request constructive feedback.";
    let automatedReply = "Thank you for taking the time to leave feedback. We appreciate your input and are continuously striving to improve our services.";

    if (sentiment.category === "positive") {
      detectedTone = "Enthusiastic & Grateful";
      toneReasoning = `Customer expressed ${sentiment.label.toLowerCase()} feedback. Auto-selected an enthusiastic tone to reinforce brand loyalty.`;
      automatedReply = "Thank you so much for the fantastic feedback! We are thrilled to hear you had such a great experience with us. We look forward to serving you again soon!";
    } else if (sentiment.category === "negative") {
      detectedTone = "Empathetic & Solution-Oriented";
      toneReasoning = `Customer expressed ${sentiment.label.toLowerCase()} frustration. Auto-selected an empathetic tone to de-escalate and offer support.`;
      automatedReply = "We are truly sorry to hear about your experience. This does not reflect the standard of quality we aim to provide. Please reach out directly to our support team at support@example.com so we can make things right immediately.";
    }

    return {
      sentimentLabel: sentiment.label,
      confidence: sentiment.confidence,
      detectedTone,
      toneReasoning,
      explanation: `Analysis identified ${sentiment.label.toLowerCase()} emotional indicators in the review text.`,
      automatedReply
    };
  }
}


// ==========================================
// 3. SAMPLE DATA SETS
// ==========================================

const SAMPLE_REVIEWS = [
  {
    label: "Strongly Positive",
    text: "This is hands down the best service I have ever used! Absolute perfection from start to finish. Exceeded all my expectations!"
  },
  {
    label: "Strongly Negative",
    text: "Total scam! Package arrived broken, customer service was furious and rude, and they refused my refund request immediately. Never again!"
  },
  {
    label: "Neutral",
    text: "The item arrived on time. Packaging was standard. Works as expected, nothing special to highlight."
  }
];

// ==========================================
// 4. MAIN APPLICATION COMPONENT
// ==========================================

export default function App() {
  const [review, setReview] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("gemini_api_key", key);
  };

  const executeAnalysis = async (textToAnalyze) => {
    if (!textToAnalyze.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const fallbackSentiment = await predictSentiment(textToAnalyze);
      const aiData = await generateAutomatedReply(textToAnalyze, fallbackSentiment, apiKey);

      const newResult = {
        id: Date.now(),
        review: textToAnalyze,
        sentimentLabel: aiData.sentimentLabel,
        confidence: aiData.confidence,
        detectedTone: aiData.detectedTone,
        toneReasoning: aiData.toneReasoning,
        explanation: aiData.explanation,
        automatedReply: aiData.automatedReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev.slice(0, 4)]);
    } catch (err) {
      setError(err.message || "An error occurred during automated analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReply = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSentimentBadge = (label) => {
    switch (label) {
      case "Strongly Positive":
        return { style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: <ThumbsUp size={16} /> };
      case "Positive":
        return { style: "bg-teal-500/15 text-teal-300 border-teal-500/30", icon: <ThumbsUp size={16} /> };
      case "Neutral":
        return { style: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: <MinusCircle size={16} /> };
      case "Negative":
        return { style: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: <ThumbsDown size={16} /> };
      case "Strongly Negative":
        return { style: "bg-rose-500/15 text-rose-300 border-rose-500/30", icon: <ThumbsDown size={16} /> };
      default:
        return { style: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: <MinusCircle size={16} /> };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider mb-4 shadow-inner">
            <Bot size={14} className="animate-bounce" /> Dynamic Auto-Tone AI Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            ReviewRadar Auto-Reply
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Paste a customer review and let Gemini automatically detect sentiment, determine the ideal response tone, and draft a response.
          </p>

          {/* Key Config */}
          <div className="mt-6 flex justify-center items-center gap-3">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5"
            >
              <Key size={13} />
              {apiKey ? "Gemini Key Configured" : "Add Gemini API Key"}
            </button>
          </div>

          {showApiKeyInput && (
            <div className="mt-4 max-w-md mx-auto p-4 rounded-xl bg-slate-900 border border-slate-800 text-left animate-in fade-in duration-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Custom Gemini API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="Paste Gemini API key"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {apiKey && (
                  <button
                    onClick={() => handleSaveApiKey("")}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Workspace */}
        <section className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <label htmlFor="review" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" /> Incoming Customer Review
            </label>
            <span className="text-xs text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Compass size={12} /> Auto Tone Detection Active
            </span>
          </div>

          <textarea
            id="review"
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Paste product review or customer feedback here..."
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm sm:text-base mb-4"
          />

          {/* Sample Presets */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <Zap size={12} /> Test Presets:
            </span>
            {SAMPLE_REVIEWS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setReview(sample.text);
                  executeAnalysis(sample.text);
                }}
                className="text-xs bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>gemini-2.5-flash Sentiment & Tone Engine</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setReview("");
                  setResult(null);
                  setError(null);
                }}
                disabled={!review || loading}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 disabled:opacity-30 px-3 py-2"
              >
                <RefreshCw size={13} /> Clear
              </button>

              <button
                onClick={() => executeAnalysis(review)}
                disabled={!review.trim() || loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 active:scale-95 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    Auto-Analyze & Reply <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Output Panel */}
        {result && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Badges */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                  AI Evaluation
                </span>
                <h2 className="text-lg font-bold text-white">Sentiment & Auto-Determined Tone</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(() => {
                  const badge = getSentimentBadge(result.sentimentLabel);
                  return (
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${badge.style}`}>
                      {badge.icon}
                      {result.sentimentLabel}
                    </span>
                  );
                })()}

                <span className="text-sm text-slate-400 font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  {result.confidence}% confidence
                </span>
              </div>
            </div>

            {/* Auto-Tone Badge & Explanation */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <Compass size={14} /> Auto-Selected Tone: <span className="text-white underline decoration-indigo-400">{result.detectedTone}</span>
              </div>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                {result.toneReasoning}
              </p>
            </div>

            {/* Review Explanation */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Why this rating?
              </span>
              <p className="text-slate-200 text-sm bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Automated Reply Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Bot size={14} className="text-indigo-400" /> Automated Customer Response
                </span>
                <button
                  onClick={() => handleCopyReply(result.automatedReply)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy Reply"}
                </button>
              </div>

              <div className="bg-gradient-to-b from-indigo-950/30 to-purple-950/20 border border-indigo-500/20 p-5 rounded-xl text-slate-100 text-sm sm:text-base leading-relaxed">
                {result.automatedReply}
              </div>
            </div>
          </section>
        )}

        {/* History Log */}
        {history.length > 0 && (
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <History size={16} className="text-indigo-400" /> Automated Response Log
              </h3>
              <button
                onClick={() => setHistory([])}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear History
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => {
                const badge = getSentimentBadge(item.sentimentLabel);
                return (
                  <div key={item.id} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.style}`}>
                          {item.sentimentLabel}
                        </span>
                        <span className="text-indigo-400 font-semibold text-[11px]">Tone: {item.detectedTone}</span>
                      </div>
                      <span className="text-slate-500 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-300 italic truncate">"{item.review}"</p>
                    <p className="text-indigo-300 font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800/80">
                      Reply: {item.automatedReply}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>ReviewRadar Auto-Reply Studio &bull; Gemini 2.5 Flash Automated Response Engine</p>
      </footer>
    </div>
  );
}