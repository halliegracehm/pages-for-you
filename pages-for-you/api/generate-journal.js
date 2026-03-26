// api/generate-journal.js
// Vercel serverless function

const { Resend } = require("resend");

async function generateJournalContent(answers) {
  const { name, feeling, want, struggling, style } = answers;

  const systemPrompt = `You are a warm, deeply empathetic journaling guide. You create deeply personalized 30-day journals that feel like they were written by someone who truly knows and cares about the person. Your language is gentle, honest, poetic but never overwrought. You write in second person ("you", "your").`;

  const userPrompt = `Create a complete 30-day personalized journal for ${name}.

Here is what they shared:
- What they're carrying: "${feeling}"
- What they want to feel in 30 days: "${want}"
- Area needing attention: ${struggling}
- How they journal best: ${style}

Generate a complete journal with this structure:

## A Note for ${name}
(A warm, personal 3-4 sentence opening written directly to them based on what they shared. Make it feel like it comes from someone who truly read what they wrote.)

## Your Intention for These 30 Days
(One powerful sentence they can return to — based on what they want to feel)

---

## Week 1: Arriving
(Theme tied to their specific situation)

**Day 1 Prompt:** (deeply personal to what they shared)
**Day 1 Affirmation:** 
**Day 2 Prompt:**
**Day 2 Affirmation:**
**Day 3 Prompt:**
**Day 3 Affirmation:**
**Day 4 Prompt:**
**Day 4 Affirmation:**
**Day 5 Prompt:**
**Day 5 Affirmation:**
**Day 6 Prompt:**
**Day 6 Affirmation:**
**Day 7 Prompt:**
**Day 7 Affirmation:**
**Week 1 Intention:** (a short intention for the week)

## Week 2: Softening
(Theme)
**Day 8-14** (same format as week 1)
**Week 2 Intention:**

## Week 3: Shifting
(Theme)
**Day 15-21** (same format)
**Week 3 Intention:**

## Week 4: Becoming
(Theme)
**Day 22-28** (same format)
**Week 4 Intention:**

## Final Days: Arriving
**Day 29 Prompt:**
**Day 29 Affirmation:**
**Day 30 Prompt:**
**Day 30 Affirmation:**

## A Closing Note
(3-4 warm sentences acknowledging how far they've come and what they're growing into)

Make every prompt and affirmation feel genuinely tailored to ${name}'s specific situation. Reference the themes from what they shared without being heavy-handed. The prompts should feel like they come from a trusted friend, not a worksheet.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function generatePDFHTML(content, answers) {
  const { name } = answers;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Convert markdown-ish content to HTML
  const formatted = content
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^\*\*(.+?)\*\*(.*)$/gm, '<p><strong>$1</strong>$2</p>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h2phr])/gm, '<p>')
    .replace(/(?<![>])\n(?![<])/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;600;700&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Lora', serif;
    background: #fffdf8;
    color: #5a2e0e;
    max-width: 680px;
    margin: 0 auto;
    padding: 60px 48px;
    line-height: 1.85;
  }

  .cover {
    text-align: center;
    padding: 80px 0 60px;
    border-bottom: 2px solid rgba(200,137,90,0.2);
    margin-bottom: 60px;
  }

  .cover-icon { font-size: 64px; margin-bottom: 24px; }

  .cover-title {
    font-size: 48px;
    font-weight: 600;
    color: #5a2e0e;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .cover-subtitle {
    font-size: 18px;
    color: #c8895a;
    font-style: italic;
    margin-bottom: 24px;
  }

  .cover-name {
    font-size: 14px;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    color: #b08060;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cover-date {
    font-size: 13px;
    color: #b08060;
    margin-top: 6px;
  }

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #7a4a1e;
    margin: 48px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(200,137,90,0.2);
  }

  p {
    margin-bottom: 16px;
    font-size: 15px;
    color: #6a4020;
  }

  strong {
    color: #7a4a1e;
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid rgba(200,137,90,0.15);
    margin: 40px 0;
  }

  .prompt-block {
    background: rgba(200,137,90,0.05);
    border-left: 3px solid #c8895a;
    border-radius: 0 12px 12px 0;
    padding: 16px 20px;
    margin: 16px 0;
  }

  .affirmation-block {
    background: rgba(155,126,184,0.06);
    border-left: 3px solid #9b7eb8;
    border-radius: 0 12px 12px 0;
    padding: 12px 20px;
    margin: 10px 0;
    font-style: italic;
  }

  .intention-block {
    background: rgba(122,74,30,0.06);
    border-radius: 12px;
    padding: 16px 20px;
    margin: 24px 0;
    text-align: center;
    font-style: italic;
    font-size: 16px;
    color: #7a4a1e;
  }

  .footer {
    text-align: center;
    margin-top: 80px;
    padding-top: 32px;
    border-top: 1px solid rgba(200,137,90,0.2);
    font-size: 12px;
    color: #b08060;
    font-family: 'Nunito', sans-serif;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-icon">🌿</div>
  <div class="cover-title">Pages for You</div>
  <div class="cover-subtitle">A 30-Day Personal Journal</div>
  <div class="cover-name">Written for ${name}</div>
  <div class="cover-date">${today}</div>
</div>

<div class="content">
${formatted}
</div>

<div class="footer">
  Pages for You · Created by Hallie · halliewho.com<br>
  This journal was written just for you. Return to it whenever you need it. 🌿
</div>

</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { answers, email } = req.body;

  try {
    // 1. Generate journal content with Claude
    const journalContent = await generateJournalContent(answers);

    // 2. Generate PDF HTML
    const pdfHTML = generatePDFHTML(journalContent, answers);

    // 3. Convert to PDF using a simple HTML-to-PDF service
    // Using Browserless.io or similar — for now we'll use the HTML itself
    // and attach it. In production, swap for a proper PDF service.
    const pdfBuffer = Buffer.from(pdfHTML, "utf-8");
    const pdfBase64 = pdfBuffer.toString("base64");

    // 4. Send email via Resend with PDF attached
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Hallie at Pages for You <hello@halliewho.com>",
      to: email,
      subject: `${answers.name}, your journal is ready 🌿`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #5a2e0e; background: #fffdf8;">
          <div style="font-size: 48px; margin-bottom: 16px;">🌿</div>
          <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 12px;">${answers.name}, your journal is ready.</h1>
          <p style="font-size: 16px; line-height: 1.75; color: #9a7050; font-style: italic; margin-bottom: 28px;">
            30 days of prompts, affirmations, and intentions — written just for you. It's attached to this email.
          </p>
          <p style="font-size: 14px; color: #b08060; line-height: 1.7;">
            I hope these pages meet you exactly where you are. Come back to them whenever you need to. 🌿
          </p>
          <p style="font-size: 14px; color: #b08060; margin-top: 20px;">With love,<br><strong>Hallie</strong></p>
          <hr style="border: none; border-top: 1px solid rgba(200,137,90,0.2); margin: 32px 0;">
          <p style="font-size: 12px; color: #c8a070;">Pages for You · halliewho.com</p>
        </div>
      `,
      attachments: [{
        filename: "Pages-for-You.pdf",
        content: pdfBase64,
      }],
    });

    // 5. Return the HTML as a data URL for in-browser download
    const dataUrl = `data:text/html;base64,${pdfBase64}`;

    res.json({ pdfUrl: dataUrl, success: true });

  } catch (error) {
    console.error("Journal generation error:", error);
    res.status(500).json({ error: error.message });
  }
}
