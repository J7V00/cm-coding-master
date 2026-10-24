// Admin messages API — uses service role on the server only.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-gate",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const gate = Deno.env.get("ADMIN_GATE") || "";
  const provided = req.headers.get("x-admin-gate") || "";
  if (!gate || provided !== gate) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);
  const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));

  if (req.method === "GET" || body.action === "list") {
    const { data, error } = await sb.from("messages").select("*").order("created_at", { ascending: false });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (body.action === "update") {
    const { error } = await sb.from("messages").update({ status: body.status }).eq("id", body.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (body.action === "delete") {
    const { error } = await sb.from("messages").delete().eq("id", body.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
