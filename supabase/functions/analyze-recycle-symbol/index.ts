// Analyze a recycle-symbol image with Google Gemini.
// Returns a structured verdict; recyclability is determined by AI only.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
}

interface Verdict {
  isRecyclable: boolean;
  confidence: "high" | "medium" | "low";
  symbolDetected: string | null;
  reasoning: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as AnalyzeRequest;
    if (!body?.imageBase64 || !body?.mimeType) {
      return new Response(
        JSON.stringify({ error: "imageBase64 and mimeType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = `You are an expert in plastic recycling symbols. Analyze the provided image and determine whether it shows a valid recycling symbol (the chasing arrows triangle with or without a resin identification code 1-7, or other widely recognized recyclability marks).

- Set isRecyclable=true ONLY if a clear, valid recycle symbol is visible.
- If the symbol is unclear, partial, or absent, set isRecyclable=false.
- symbolDetected: the resin code label (e.g. "PET / #1", "HDPE / #2", "Generic recycle triangle") or null.
- confidence: "high" | "medium" | "low".
- reasoning: one short sentence.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: body.mimeType, data: body.imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            isRecyclable: { type: "BOOLEAN" },
            confidence: { type: "STRING", enum: ["high", "medium", "low"] },
            symbolDetected: { type: "STRING", nullable: true },
            reasoning: { type: "STRING" },
          },
          required: ["isRecyclable", "confidence", "reasoning"],
        },
      },
    });

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const baseDelays = [500, 1000, 2000]; // ms between attempts 1→2, 2→3, 3→4
    const maxAttempts = baseDelays.length + 1;

    let geminiResponse!: Response;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      geminiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (geminiResponse.ok) break;

      const status = geminiResponse.status;
      const transient = status === 503 || status === 429;
      const isLast = attempt === maxAttempts - 1;

      if (!transient || isLast) {
        const errText = await geminiResponse.text();
        console.error("Gemini API error", status, errText);
        const respStatus = status === 429 ? 429 : status === 503 ? 503 : 502;
        return new Response(
          JSON.stringify({
            error:
              status === 429
                ? "AI rate limit reached. Please try again shortly."
                : status === 503
                ? "AI service is temporarily overloaded. Please try again in a moment."
                : "AI service error.",
          }),
          { status: respStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Drain body before retry to avoid resource leaks
      await geminiResponse.text();
      const base = baseDelays[attempt];
      const delay = Math.round(base * (0.8 + Math.random() * 0.4));
      console.warn(
        `Gemini ${status} on attempt ${attempt + 1}/${maxAttempts}, retrying in ${delay}ms`,
      );
      await sleep(delay);
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let verdict: Verdict;
    try {
      verdict = JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini response", text);
      return new Response(
        JSON.stringify({ error: "Could not parse AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(verdict), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-recycle-symbol error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
