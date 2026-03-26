// api/create-checkout.js
// Vercel serverless function

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, answers } = req.body;

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: 1200, // $12.00
        product_data: {
          name: "Pages for You — 30-Day Personalized Journal",
          description: "A fully personalized 30-day journal PDF written just for you.",
          images: ["https://halliewho.com/wp-content/uploads/2025/pages-for-you-cover.png"],
        },
      },
      quantity: 1,
    }],
    metadata: {
      answers: JSON.stringify(answers),
      email,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL || "https://pages-for-you.vercel.app"}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://pages-for-you.vercel.app"}?cancelled=true`,
  });

  res.json({ sessionId: session.id });
}
