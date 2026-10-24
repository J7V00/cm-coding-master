// Secure AI proxy — keep provider API keys in Supabase secrets, never in the frontend.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("AI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI provider is not configured." }), {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("AI_MODEL") || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Code Master AI, a coding assistant. Propose file changes clearly. Never claim you already wrote files unless the user approved Keep.",
          },
          ...messages,
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
