import {
  DeezerClient,
  type DeezerSearchResult,
  type DeezerSearchType,
} from "../integrations/deezer/deezer.client.js";

const deezerClient = new DeezerClient();

export type SearchResult =
  | { ok: true; results: DeezerSearchResult }
  | { ok: false; error: "DEEZER_ERROR" };

export async function search(input: {
  query: string;
  type: DeezerSearchType;
}): Promise<SearchResult> {
  try {
    const results = await deezerClient.search(input.query, input.type);

    if (results.type === "artist") {
      results.results.sort((a, b) => b.nb_fan - a.nb_fan);
    }

    return { ok: true, results };
  } catch {
    return { ok: false, error: "DEEZER_ERROR" };
  }
}