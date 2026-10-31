import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ configured: false, balance: null });
    }

    const res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ configured: true, valid: false, balance: null });
    }

    const data = await res.json();
    const limit = data.data?.limit;
    const usage = data.data?.usage;
    const balance = limit !== null && limit !== undefined ? limit - (usage || 0) : null;

    return NextResponse.json({
      configured: true,
      valid: true,
      label: data.data?.label,
      usage: usage,
      limit: limit,
      balance: balance !== null ? Math.round(balance * 100) / 100 : null,
    });
  } catch (error) {
    return NextResponse.json({ configured: true, valid: false, balance: null });
  }
}
