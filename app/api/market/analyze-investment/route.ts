import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticker, shares, currentPrice, totalCostCents, remainingBudgetCents, crewName } = await req.json();

    const prompt = `You are a financial advisor AI in CrewCash, a shared budgeting app. 
The crew "${crewName}" is considering making a paper trade investment.

Investment Details:
- Stock: ${ticker}
- Shares: ${shares}
- Price per share: $${currentPrice.toFixed(2)}
- Total Cost: $${(totalCostCents / 100).toFixed(2)}
- Crew's Remaining Budget: $${(remainingBudgetCents / 100).toFixed(2)}

Please write a brief, friendly 2-3 paragraph analysis of this investment.
Address the impact on the crew's budget. Are they spending too much of their remaining budget on this one asset?
Remind them this is a paper trade for educational purposes.
Do NOT output markdown headers, just plain text paragraphs.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ analysis: "Demo Mode: The investment impact looks manageable, but be cautious with large trades! (Add GEMINI_API_KEY for real analysis)" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const raw = await response.json();
    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Empty response from AI provider');
    }

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error('AI Investment Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze investment' },
      { status: 500 }
    );
  }
}
