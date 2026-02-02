//APP\app\lib\ai\prompts\dofPrompt.ts
export function buildDofPrompt({
  templateName,
  findings,
}: {
  templateName: string;
  findings: {
    question: string;
    category: string;
    severity: string;
  }[];
}) {
  return `
You are an ISO 9001 / ISO 45001 certified expert.
Generate corrective actions (DÖF) in Turkish.

Audit Template: ${templateName}

Nonconformities:
${findings
  .map(
    (f, i) =>
      `${i + 1}. ${f.question} (${f.category}, ${f.severity})`
  )
  .join("\n")}

Return STRICT JSON:
{
  "items": [
    {
      "question": "...",
      "corrective_action": "...",
      "iso": "ISO 45001 6.1.2",
      "confidence": 85
    }
  ]
}
`;
}
