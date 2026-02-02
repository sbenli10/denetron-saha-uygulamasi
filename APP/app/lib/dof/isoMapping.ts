//APP\app\lib\dof\isoMapping.ts
export function mapIsoClause({
  riskText,
  severity,
}: {
  riskText: string;
  severity: string;
}) {
  const t = riskText.toLowerCase();

  if (t.includes("kkd")) return "ISO 45001 8.1";
  if (t.includes("yangın")) return "ISO 45001 8.2";
  if (t.includes("eğitim") || t.includes("sertifika"))
    return "ISO 9001 7.2";

  if (
    severity === "high" ||
    severity === "critical" ||
    severity === "manual review"
  ) {
    return "ISO 45001 6.1.2";
  }

  return null;
}
