//APP\app\api\admin\isg\analyze\annual-plan\ics\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

const MONTH_START_HOUR = 9; // 09:00
const EVENT_DURATION_HOURS = 1;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toICSDate(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

export async function GET() {
  const supabase = supabaseServerClient();
  const currentYear = new Date().getFullYear();

  /* ---------- AUTH ---------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  /* ---------- ORG ---------- */
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return NextResponse.json(
      { error: "ORG_NOT_FOUND" },
      { status: 400 }
    );
  }

  /* ---------- FETCH EXECUTIONS (SADECE AKTİF YIL) ---------- */
  const { data: executions, error } = await supabase
    .from("annual_plan_executions")
    .select("*")
    .eq("organization_id", orgId)
    .eq("plan_year", currentYear)
    .order("planned_month", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "DB_ERROR" },
      { status: 500 }
    );
  }

  if (!executions || executions.length === 0) {
    return NextResponse.json(
      {
        error: "NO_EXECUTIONS",
        message:
          "Takvime aktarılmış bir yıllık eğitim planı bulunamadı. " +
          "Önce yıllık eğitim planı analiz edilmeli ve ay bazlı faaliyetler oluşturulmalıdır.",
      },
      { status: 404 }
    );
  }

  /* ---------- BUILD ICS ---------- */
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Denetron//ISG Annual Plan//TR
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  for (const ex of executions) {
    const start = new Date(
      Date.UTC(
        ex.plan_year,
        ex.planned_month - 1,
        1,
        MONTH_START_HOUR,
        0,
        0
      )
    );

    const end = new Date(start);
    end.setUTCHours(start.getUTCHours() + EVENT_DURATION_HOURS);

    ics += `BEGIN:VEVENT
UID:${ex.id}@denetron.app
DTSTAMP:${toICSDate(new Date())}
DTSTART:${toICSDate(start)}
DTEND:${toICSDate(end)}
SUMMARY:${ex.activity}
DESCRIPTION:İSG Yıllık Eğitim Planı\\nPeriyot: ${ex.planned_period}
STATUS:CONFIRMED
END:VEVENT
`;
  }

  ics += "END:VCALENDAR";

  /* ---------- RESPONSE ---------- */
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="isg-egitim-plani-${currentYear}.ics"`,
    },
  });
}
