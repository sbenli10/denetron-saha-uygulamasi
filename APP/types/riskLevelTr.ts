import type { RiskLevel } from "./risk";

export function riskLevelTr(level?: RiskLevel): string {
  switch (level) {
    case "Low":
      return "Düşük";
    case "Medium":
      return "Orta";
    case "High":
      return "Yüksek";
    case "Critical":
      return "Kritik";
    case "Manual Review":
      return "Manuel İnceleme";
    default:
      return "—";
  }
}
