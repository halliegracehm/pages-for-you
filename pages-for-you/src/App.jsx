import { useState, useEffect } from "react";

const STRIPE_PUBLISHABLE_KEY = "pk_live_51TBmTBDC5IHfzeBkp5DgUYOdkSUiMYebP36KU3wa4hMHRKvaD3VeivtmyVgBFcwVNPxHp2qfD1vbAOCynlhMGIpu00rME400j2";

const QUESTIONS = [
  {
    id: "name",
    question: "First, what's your name?",
    subtitle: "This journal is being written just for you.",
    type: "text",
    placeholder: "Your first name...",
  },
  {
    id: "feeling",
    question: "What's the heaviest thing you're carrying right now?",
    subtitle: "Be honest. This is just between you and these pages.",
    type: "textarea",
    placeholder: "It might be something you've been pushing down, something unresolved, something you can't stop thinking about...",
  },
  {
    id: "want",
    question: "What do you most want to feel 30 days from now?",
    subtitle: "Not what you want to have done — how you want to feel.",
    type: "textarea",
    placeholder: "Lighter, clearer, more like myself, more at peace...",
  },
  {
    id: "struggling",
    question: "What area of your life needs the most gentle attention?",
    subtitle: "Choose the one that feels most true right now.",
    type: "chips",
    options: ["Relationships", "Self-worth", "Grief or loss", "Anxiety", "Identity", "Healing", "Motivation", "Boundaries", "Purpose", "Body & health"],
  },
  {
    id: "style",
    question: "How do you journal best?",
    subtitle: "We'll shape your prompts around how your mind works.",
    type: "chips",
    options: ["Deep & reflective", "Short & honest", "Storytelling", "Lists & structure", "Stream of consciousness", "Questions to sit with"],
  },
];

export default function App() {
  const [step, setStep] = useState("landing"); // landing | questions | payment | generating | done
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState("");

  function handleAnswer(value) {
    setAnswers(a => ({ ...a, [QUESTIONS[currentQ].id]: value }));
  }

  function nextQuestion() {
    const current = QUESTIONS[currentQ];
    const val = answers[current.id];
    if (!val || (typeof val === "string" && !val.trim())) return;
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
      setDraft("");
    } else {
      setStep("payment");
    }
  }

  async function handlePayment() {
    if (!email.trim()) { setError("Please enter your email so we can send your journal."); return; }
    setError("");
    setLoading(true);
    try {
      if (!window.Stripe) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://js.stripe.com/v3/";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const { sessionId } = await res.json();
      await stripe.redirectToCheckout({ sessionId });
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // On return from Stripe success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const savedAnswers = sessionStorage.getItem("pfy_answers");
      const savedEmail = sessionStorage.getItem("pfy_email");
      if (savedAnswers && savedEmail) {
        setAnswers(JSON.parse(savedAnswers));
        setEmail(savedEmail);
        setStep("generating");
        generateJournal(JSON.parse(savedAnswers), savedEmail);
      }
    }
  }, []);

  async function generateJournal(ans, em) {
    try {
      const res = await fetch("/api/generate-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans, email: em }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const { pdfUrl: url } = await res.json();
      setPdfUrl(url);
      setStep("done");
    } catch (e) {
      setError("Something went wrong generating your journal. Please email hello@halliewho.com and we'll fix it right away.");
      setStep("done");
    }
  }

  if (step === "landing") return <Landing onStart={() => setStep("questions")} />;
  if (step === "questions") return (
    <Questions
      questions={QUESTIONS}
      currentQ={currentQ}
      answers={answers}
      draft={draft}
      setDraft={setDraft}
      onAnswer={handleAnswer}
      onNext={nextQuestion}
      onBack={() => currentQ > 0 ? setCurrentQ(q => q - 1) : setStep("landing")}
    />
  );
  if (step === "payment") return (
    <Payment
      answers={answers}
      email={email}
      setEmail={setEmail}
      onPay={handlePayment}
      onBack={() => setStep("questions")}
      loading={loading}
      error={error}
    />
  );
  if (step === "generating") return <Generating name={answers.name} />;
  if (step === "done") return <Done name={answers.name} pdfUrl={pdfUrl} error={error} />;
}

// ── Landing ───────────────────────────────────────────────────────────────
function Landing({ onStart }) {
  return (
    <div style={styles.page}>
      <GrainOverlay />
      <div style={styles.landingInner}>
        <div style={styles.eyebrow}>✦ a journal written only for you</div>
        <h1 style={styles.heroTitle}>
          Pages<br />
          <em style={{ color: "var(--accent)", fontStyle: "italic" }}>for You</em>
        </h1>
        <p style={styles.heroSub}>
          Answer five honest questions. Receive a full 30-day personalized journal — 
          prompts, affirmations, and intentions written around exactly where you are right now.
        </p>
        <div style={styles.features}>
          {[
            { icon: "🌿", text: "30 days of prompts written just for you" },
            { icon: "💫", text: "Daily affirmations tied to your journey" },
            { icon: "🎯", text: "Weekly intentions based on what you need" },
            { icon: "📄", text: "Beautiful PDF, yours to keep forever" },
          ].map(f => (
            <div key={f.text} style={styles.featureRow}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>
        <button onClick={onStart} style={styles.ctaBtn}>
          Begin my journal → <span style={styles.price}>$12</span>
        </button>
        <p style={styles.byline}>Created by Hallie · My Sister's Closet</p>
      </div>
    </div>
  );
}

// ── Questions ─────────────────────────────────────────────────────────────
function Questions({ questions, currentQ, answers, draft, setDraft, onAnswer, onNext, onBack }) {
  const q = questions[currentQ];
  const progress = ((currentQ) / questions.length) * 100;
  const val = answers[q.id];

  function handleChip(option) {
    onAnswer(option);
  }

  function handleKey(e) {
    if (e.key === "Enter" && q.type === "text") { e.preventDefault(); onNext(); }
  }

  return (
    <div style={styles.page}>
      <GrainOverlay />
      <div style={styles.questionInner}>
        {/* Progress */}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={styles.progressLabel}>{currentQ + 1} of {questions.length}</div>

        {/* Question */}
        <div style={styles.questionCard}>
          <p style={styles.questionSubtitle}>{q.subtitle}</p>
          <h2 style={styles.questionText}>{q.question}</h2>

          {q.type === "text" && (
            <input
              style={styles.textInput}
              placeholder={q.placeholder}
              value={val || ""}
              onChange={e => onAnswer(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
          )}

          {q.type === "textarea" && (
            <textarea
              style={styles.textArea}
              placeholder={q.placeholder}
              value={val || ""}
              onChange={e => onAnswer(e.target.value)}
              autoFocus
              rows={5}
            />
          )}

          {q.type === "chips" && (
            <div style={styles.chipsWrap}>
              {q.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleChip(opt)}
                  style={{ ...styles.chip, ...(val === opt ? styles.chipActive : {}) }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div style={styles.questionNav}>
            <button onClick={onBack} style={styles.backBtn}>← Back</button>
            <button
              onClick={onNext}
              style={{ ...styles.nextBtn, opacity: val ? 1 : 0.4, cursor: val ? "pointer" : "default" }}
              disabled={!val}
            >
              {currentQ === questions.length - 1 ? "Continue →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payment ───────────────────────────────────────────────────────────────
function Payment({ answers, email, setEmail, onPay, onBack, loading, error }) {
  return (
    <div style={styles.page}>
      <GrainOverlay />
      <div style={styles.paymentInner}>
        <div style={styles.paymentCard}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <h2 style={styles.paymentTitle}>Your journal is ready to be written</h2>
            <p style={styles.paymentSub}>
              {answers.name ? `${answers.name}, based on` : "Based on"} everything you've shared, 
              we're about to create 30 days of prompts, affirmations, and intentions written just for you.
            </p>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Pages for You — 30-Day Personalized Journal</span>
              <span style={styles.summaryPrice}>$12</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--subtext)", marginTop: 6 }}>
              Beautiful PDF • Delivered instantly • Yours to keep forever
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={styles.emailLabel}>Where should we send your journal?</label>
            <input
              style={styles.emailInput}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onPay()}
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button onClick={onPay} disabled={loading} style={styles.payBtn}>
            {loading ? "Opening checkout..." : "Get my journal for $12 →"}
          </button>

          <p style={styles.secureNote}>🔒 Secure payment via Stripe</p>
          <button onClick={onBack} style={styles.backBtnSmall}>← Go back</button>
        </div>
      </div>
    </div>
  );
}

// ── Generating ────────────────────────────────────────────────────────────
function Generating({ name }) {
  const [messageIdx, setMessageIdx] = useState(0);
  const messages = [
    "Reading everything you shared...",
    "Crafting your first week of prompts...",
    "Writing your personal affirmations...",
    "Building your weekly intentions...",
    "Finishing the final pages...",
    "Almost ready...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx(i => Math.min(i + 1, messages.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ ...styles.page, justifyContent: "center", alignItems: "center" }}>
      <GrainOverlay />
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 24, animation: "float 2.5s ease-in-out infinite" }}>🌿</div>
        <h2 style={{ ...styles.paymentTitle, marginBottom: 12 }}>
          Writing your journal{name ? `, ${name}` : ""}...
        </h2>
        <p style={{ color: "var(--subtext)", fontSize: 15, fontStyle: "italic", fontFamily: "'Lora', serif", marginBottom: 40 }}>
          {messages[messageIdx]}
        </p>
        <div style={styles.loadingDots}>
          <span /><span /><span />
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ── Done ──────────────────────────────────────────────────────────────────
function Done({ name, pdfUrl, error }) {
  return (
    <div style={{ ...styles.page, justifyContent: "center", alignItems: "center" }}>
      <GrainOverlay />
      <div style={{ ...styles.paymentCard, maxWidth: 480, textAlign: "center" }}>
        {error ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💌</div>
            <h2 style={styles.paymentTitle}>Something went wrong</h2>
            <p style={{ color: "var(--subtext)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
            <h2 style={styles.paymentTitle}>
              {name ? `${name}, your journal is ready.` : "Your journal is ready."}
            </h2>
            <p style={{ color: "var(--subtext)", fontSize: 15, lineHeight: 1.75, fontFamily: "'Lora', serif", fontStyle: "italic", marginBottom: 32 }}>
              30 days of prompts, affirmations, and intentions — written just for you. 
              We've also sent it to your email.
            </p>
            {pdfUrl && (
              <a href={pdfUrl} download="Pages-for-You.pdf" style={styles.downloadBtn}>
                Download my journal →
              </a>
            )}
            <p style={{ fontSize: 13, color: "var(--subtext)", marginTop: 24 }}>
              Made with love by Hallie · <a href="https://halliewho.com" style={{ color: "var(--accent)" }}>halliewho.com</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Grain Overlay ─────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8895a' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');
        :root {
          --bg: #fdf6ec;
          --bg2: #f5e8d3;
          --card: rgba(255,252,246,0.97);
          --text: #5a2e0e;
          --subtext: #b08060;
          --accent: #c8895a;
          --accent-dark: #7a4a1e;
          --border: rgba(200,137,90,0.2);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Nunito', sans-serif; background: var(--bg); }
        textarea { resize: none; }
        button { transition: opacity .15s, transform .15s; }
        button:hover { opacity: 0.88; }
        button:active { transform: scale(0.98); }
      `}</style>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #fdf6ec 0%, #f5e8d3 50%, #ede0cc 100%)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflowX: "hidden",
  },
  landingInner: {
    position: "relative", zIndex: 1,
    maxWidth: 560, margin: "0 auto",
    padding: "80px 24px 60px",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
  },
  eyebrow: {
    fontSize: 11, fontWeight: 700, color: "var(--accent)",
    textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 24,
  },
  heroTitle: {
    fontFamily: "'Lora', serif", fontSize: "clamp(52px, 10vw, 88px)",
    color: "var(--text)", fontWeight: 600, lineHeight: 1.05, marginBottom: 24,
  },
  heroSub: {
    fontFamily: "'Lora', serif", fontSize: 17, color: "var(--subtext)",
    lineHeight: 1.8, fontStyle: "italic", maxWidth: 460, marginBottom: 40,
  },
  features: {
    display: "flex", flexDirection: "column", gap: 12,
    width: "100%", maxWidth: 380, marginBottom: 44,
  },
  featureRow: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,252,246,0.8)", border: "1px solid var(--border)",
    borderRadius: 14, padding: "11px 16px", textAlign: "left",
  },
  featureText: { fontSize: 14, color: "var(--text)", fontWeight: 600 },
  ctaBtn: {
    background: "linear-gradient(135deg, #d4956a, #c8895a)",
    color: "#fff", border: "none", borderRadius: 28,
    padding: "16px 40px", fontSize: 16, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
    boxShadow: "0 6px 24px rgba(200,137,90,0.4)",
    display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
  },
  price: {
    background: "rgba(255,255,255,0.25)", borderRadius: 10,
    padding: "2px 10px", fontSize: 13,
  },
  byline: { fontSize: 12, color: "var(--subtext)" },

  // Questions
  questionInner: {
    position: "relative", zIndex: 1,
    maxWidth: 600, margin: "0 auto",
    padding: "40px 24px 60px", width: "100%",
  },
  progressBar: {
    height: 3, background: "rgba(200,137,90,0.15)",
    borderRadius: 2, marginBottom: 8, overflow: "hidden",
  },
  progressFill: {
    height: "100%", background: "var(--accent)",
    borderRadius: 2, transition: "width 0.4s ease",
  },
  progressLabel: { fontSize: 11, color: "var(--subtext)", marginBottom: 32, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" },
  questionCard: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 24, padding: "36px 32px",
    boxShadow: "0 4px 30px rgba(160,100,50,0.10)",
  },
  questionSubtitle: {
    fontSize: 13, color: "var(--subtext)", fontStyle: "italic",
    fontFamily: "'Lora', serif", marginBottom: 10,
  },
  questionText: {
    fontFamily: "'Lora', serif", fontSize: "clamp(20px, 4vw, 26px)",
    color: "var(--text)", fontWeight: 600, lineHeight: 1.3, marginBottom: 28,
  },
  textInput: {
    width: "100%", padding: "13px 16px",
    border: "1px solid var(--border)", borderRadius: 14,
    background: "rgba(255,255,255,0.75)", fontFamily: "'Lora', serif",
    fontSize: 17, color: "var(--text)", outline: "none", marginBottom: 24,
  },
  textArea: {
    width: "100%", padding: "14px 16px",
    border: "1px solid var(--border)", borderRadius: 14,
    background: "rgba(255,255,255,0.75)", fontFamily: "'Lora', serif",
    fontSize: 15, color: "var(--text)", outline: "none",
    lineHeight: 1.75, fontStyle: "italic", marginBottom: 24,
  },
  chipsWrap: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  chip: {
    padding: "9px 18px", borderRadius: 20,
    border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)",
    color: "var(--subtext)", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
    transition: "all 0.15s",
  },
  chipActive: {
    background: "var(--accent)", color: "#fff",
    borderColor: "var(--accent)",
    boxShadow: "0 2px 10px rgba(200,137,90,0.35)",
  },
  questionNav: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: {
    background: "none", border: "none", color: "var(--subtext)",
    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito', sans-serif",
  },
  nextBtn: {
    background: "linear-gradient(135deg, #d4956a, #c8895a)",
    color: "#fff", border: "none", borderRadius: 20,
    padding: "11px 28px", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
    boxShadow: "0 3px 12px rgba(200,137,90,0.4)",
  },

  // Payment
  paymentInner: {
    position: "relative", zIndex: 1,
    maxWidth: 520, margin: "0 auto",
    padding: "60px 24px", width: "100%",
    display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh",
  },
  paymentCard: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 28, padding: "40px 36px",
    boxShadow: "0 8px 40px rgba(160,100,50,0.12)",
    position: "relative", zIndex: 1,
  },
  paymentTitle: {
    fontFamily: "'Lora', serif", fontSize: 24,
    color: "var(--text)", fontWeight: 600, marginBottom: 10,
  },
  paymentSub: {
    fontSize: 14, color: "var(--subtext)", lineHeight: 1.7,
    fontStyle: "italic", fontFamily: "'Lora', serif",
  },
  summaryBox: {
    background: "rgba(200,137,90,0.07)", border: "1px solid rgba(200,137,90,0.2)",
    borderRadius: 14, padding: "14px 18px", marginBottom: 24, marginTop: 24,
  },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, color: "var(--text)", fontWeight: 600 },
  summaryPrice: {
    fontSize: 20, fontWeight: 800,
    color: "var(--accent)", fontFamily: "'Lora', serif",
  },
  emailLabel: {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "var(--subtext)", textTransform: "uppercase",
    letterSpacing: "0.5px", marginBottom: 8,
  },
  emailInput: {
    width: "100%", padding: "12px 15px",
    border: "1px solid var(--border)", borderRadius: 13,
    background: "rgba(255,255,255,0.75)", fontFamily: "'Nunito', sans-serif",
    fontSize: 15, color: "var(--text)", outline: "none",
  },
  errorBox: {
    background: "rgba(200,80,60,0.08)", border: "1px solid rgba(200,80,60,0.2)",
    borderRadius: 10, padding: "8px 14px", color: "#c05040",
    fontSize: 13, fontWeight: 600, marginBottom: 14,
  },
  payBtn: {
    width: "100%", background: "linear-gradient(135deg, #d4956a, #c8895a)",
    color: "#fff", border: "none", borderRadius: 20, padding: "14px",
    fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700,
    cursor: "pointer", boxShadow: "0 4px 16px rgba(200,137,90,0.4)",
    marginBottom: 12, marginTop: 4,
  },
  secureNote: { textAlign: "center", fontSize: 12, color: "var(--subtext)", marginBottom: 16 },
  backBtnSmall: {
    background: "none", border: "none", color: "var(--subtext)",
    fontSize: 13, cursor: "pointer", display: "block", margin: "0 auto",
    fontFamily: "'Nunito', sans-serif",
  },
  downloadBtn: {
    display: "inline-block", background: "linear-gradient(135deg, #d4956a, #c8895a)",
    color: "#fff", textDecoration: "none", borderRadius: 24,
    padding: "14px 36px", fontSize: 15, fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    boxShadow: "0 4px 20px rgba(200,137,90,0.4)",
  },
  loadingDots: {
    display: "flex", gap: 10, justifyContent: "center",
  },
};
