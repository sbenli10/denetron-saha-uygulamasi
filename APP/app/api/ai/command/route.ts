import { NextResponse } from "next/server";
import { normalizeQuery } from "../_core/normalize";
import { matchKeywordIntent } from "../_core/keyword-map";
import { aiIntent } from "../_core/intent-engine";
import { mergeIntents } from "../_core/merge";

export async function POST(req: Request) {
  const { query } = await req.json();

  const norm = normalizeQuery(query);

  const keyword = matchKeywordIntent(norm);
  const ai = await aiIntent(norm);

  const result = mergeIntents({
    query: norm,
    keywordIntent: keyword,
    aiIntent: ai,
  });

  return NextResponse.json(result);
}
