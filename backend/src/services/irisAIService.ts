import OpenAI from 'openai';

/**
 * Iris AI Service
 * Generates strategic business diagnostics using the Iris method framework
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Iris Method Framework
 * Strategic diagnostic framework combining:
 * - Market positioning (environment scan)
 * - Internal capabilities (SWOT analysis)
 * - Operational readiness (maturity assessment)
 * - Strategic alignment (goal-to-action mapping)
 */
const IRIS_METHOD_PROMPT = `
You are a strategic business consultant using the IRIS diagnostic method.

IRIS METHOD FRAMEWORK:
1. (I)nternal Assessment: Evaluate the organization's capabilities, strengths, and gaps
2. (R)eality Check: Analyze market conditions, competitive landscape, and external factors
3. (I)nsight Generation: Identify patterns, opportunities, and risks from the analysis
4. (S)trategic Recommendations: Deliver actionable, prioritized recommendations

For each diagnostic, provide:
- Executive Summary (2-3 sentences of the key insight)
- Internal Assessment (capabilities, maturity level, key strengths/gaps)
- Market Reality (competitive positioning, market trends, external threats/opportunities)
- Key Insights (top 3-5 strategic insights discovered)
- Recommendations (top 3-5 actionable next steps, prioritized by impact)

Format your response as a JSON object with the following structure:
{
  "executiveSummary": "...",
  "sections": [
    {
      "name": "Internal Assessment",
      "insights": ["insight 1", "insight 2", ...]
    },
    {
      "name": "Market Reality",
      "insights": ["insight 1", "insight 2", ...]
    },
    {
      "name": "Key Insights",
      "insights": ["insight 1", "insight 2", ...]
    },
    {
      "name": "Recommendations",
      "insights": ["recommendation 1", "recommendation 2", ...]
    }
  ]
}

Respond ONLY with valid JSON. No markdown, no extra text.
`;

export interface DiagnosisContent {
  executiveSummary: string;
  sections: Array<{
    name: string;
    insights: string[];
  }>;
}

export interface DiagnosisResponse {
  content: DiagnosisContent;
  tokensUsed: number;
}

export async function generateDiagnosis(
  title: string,
  clientName?: string | null,
): Promise<DiagnosisResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const userPrompt = `
Please provide a strategic diagnosis for the following consultancy engagement:

Consultancy Title: ${title}
${clientName ? `Client: ${clientName}` : ''}

Using the IRIS method framework, generate a comprehensive strategic diagnostic that addresses:
1. The organization's current state and capabilities
2. The market context and competitive environment
3. Strategic opportunities and risks
4. Prioritized recommendations for action

Generate a thorough but focused diagnosis (aim for 1500-2000 tokens of content).
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: IRIS_METHOD_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('OpenAI returned empty response');
    }

    // Parse and validate JSON response
    let content: DiagnosisContent;
    try {
      content = JSON.parse(textContent) as DiagnosisContent;
    } catch (e) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Validate required fields
    if (!content.executiveSummary || !content.sections || !Array.isArray(content.sections)) {
      throw new Error('OpenAI response missing required fields');
    }

    // Calculate tokens used (completion + prompt)
    const tokensUsed =
      (response.usage?.completion_tokens ?? 0) + (response.usage?.prompt_tokens ?? 0);

    return {
      content,
      tokensUsed,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message} (Status: ${error.status})`);
    }
    throw error;
  }
}
