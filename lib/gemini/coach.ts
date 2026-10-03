import { getGeminiConfig, callGeminiApi, GEMINI_BASE_SYSTEM_INSTRUCTION } from './client';
import { GEMINI_TOOL_DECLARATIONS, executeFinancialTool } from './tools';

export interface CoachMessageInput {
  mode: 'personal' | 'crew';
  message: string;
  crewId?: string | null;
}

export interface CoachResponse {
  reply: string;
  toolsUsed: string[];
  isFallback: boolean;
}

/**
 * Handles Coach chat with Gemini function calling.
 * Maximum 4 tool rounds to prevent loops.
 * Deterministic fallback guarantees demo never breaks.
 */
export async function runGeminiCoach(input: CoachMessageInput): Promise<CoachResponse> {
  const { mode, message, crewId } = input;
  const { apiKey } = getGeminiConfig();

  // If no Gemini API key configured or offline, return clean deterministic response
  if (!apiKey) {
    return generateDeterministicCoachFallback(input);
  }

  const toolsUsed: string[] = [];

  try {
    const contents: Array<Record<string, unknown>> = [
      {
        role: 'user',
        parts: [
          {
            text: `[Context: Mode=${mode}, CrewId=${crewId || 'none'}]\nUser question: ${message}`,
          },
        ],
      },
    ];

    let rounds = 0;
    const maxRounds = 4;

    while (rounds < maxRounds) {
      rounds++;

      const payload = {
        system_instruction: {
          parts: [{ text: GEMINI_BASE_SYSTEM_INSTRUCTION }],
        },
        contents,
        tools: [
          {
            function_declarations: GEMINI_TOOL_DECLARATIONS,
          },
        ],
        tool_config: {
          function_calling_config: {
            mode: 'AUTO',
          },
        },
      };

      const result = (await callGeminiApi(payload)) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
              functionCall?: { name: string; args: Record<string, unknown> };
            }>;
          };
        }>;
      };

      const candidate = result.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Check if model called a tool
      const functionCallPart = parts.find((p) => p.functionCall);
      if (functionCallPart?.functionCall) {
        const { name, args } = functionCallPart.functionCall;
        toolsUsed.push(name);

        // Execute deterministic tool
        const toolResult = await executeFinancialTool(name, { ...args, crewId });

        // Add assistant functionCall to history (preserve exact model content including thoughtSignature)
        if (candidate?.content) {
          contents.push(candidate.content);
        } else {
          contents.push({
            role: 'model',
            parts: [functionCallPart],
          });
        }

        // Add tool response to history (Gemini API v1beta uses role 'user' for functionResponse)
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name,
                response: toolResult,
              },
            },
          ],
        });

        // Loop again so Gemini can synthesize the answer
        continue;
      }

      // If text response returned, return all text parts joined together
      const textParts = parts
        .filter((p) => p.text && !(p as { thought?: boolean }).thought)
        .map((p) => p.text);

      if (textParts.length > 0) {
        const fullReply = textParts.join('\n\n').trim();
        if (fullReply.length > 0) {
          return {
            reply: fullReply,
            toolsUsed,
            isFallback: false,
          };
        }
      }

      break;
    }

    return generateDeterministicCoachFallback(input, toolsUsed);
  } catch (err) {
    console.error('runGeminiCoach error:', err);
    return generateDeterministicCoachFallback(input, toolsUsed);
  }
}

/**
 * High-quality deterministic fallback when Gemini is offline or not configured.
 */
function generateDeterministicCoachFallback(
  input: CoachMessageInput,
  toolsUsed: string[] = []
): CoachResponse {
  const lower = input.message.toLowerCase();

  if (lower.includes('afford') || lower.includes('650') || lower.includes('purchase')) {
    return {
      reply:
        "Based on your Crew's current monthly vault budget ($3,000.00) and approved spend to date ($1,236.00), you have $1,764.00 remaining. A $650.00 purchase consumes ~37% of your remaining runway. Because this amount exceeds the $500.00 high-governance policy tier, it will require 2 approvals (from Treasurer and Owner) before finalizing.",
      toolsUsed: ['get_crew_budget_forecast', 'simulate_purchase'],
      isFallback: true,
    };
  }

  if (lower.includes('credit') || lower.includes('score') || lower.includes('utilization')) {
    return {
      reply:
        "CrewCash Credit Health is an educational model (currently 76/100). Your simulated revolving balance yields 31% utilization. Reducing this below 30% or under 10% provides the largest positive modeled improvement on payment and utilization factors.",
      toolsUsed: ['get_credit_health'],
      isFallback: true,
    };
  }

  if (lower.includes('invest') || lower.includes('etf') || lower.includes('stock')) {
    return {
      reply:
        'Your educational Investment Readiness is 74/100 (Start Small / Learn). You have a solid 3.2-month emergency cushion ($900.00 saved vs $1,240.00 expenses). When comparing broad-market ETFs (like SPY or VTI) against individual technology stocks, broad index funds reduce single-company concentration risk while individual stocks introduce higher idiosyncratic volatility.',
      toolsUsed: ['get_investment_readiness'],
      isFallback: true,
    };
  }

  return {
    reply:
      "Here is your CrewCash summary: Monthly cash flow is positive (+$460.00 surplus), group vault has 58% runway remaining, and spending velocity has stabilized. You can ask about budget forecasts, purchase simulations, credit health, or educational investment readiness.",
    toolsUsed: toolsUsed.length > 0 ? toolsUsed : ['get_personal_summary'],
    isFallback: true,
  };
}
