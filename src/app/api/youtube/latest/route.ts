import { NextResponse } from "next/server";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

type YouTubeResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
  }>;
};

type VideoDetailsResponse = { items?: Array<{ id?: string; contentDetails?: { duration?: string } }> };

function durationSeconds(value: string | undefined) {
  if (!value) return 0;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "YouTube API가 아직 설정되지 않았습니다." }, { status: 503 });
  }

  try {
    const channelUrl = new URL(`${YOUTUBE_API}/channels`);
    channelUrl.searchParams.set("part", "id,contentDetails");
    channelUrl.searchParams.set("forHandle", "@calvarymoses");
    channelUrl.searchParams.set("key", apiKey);
    const channelResponse = await fetch(channelUrl, { next: { revalidate: 21600 } });
    const channelData = (await channelResponse.json()) as YouTubeResponse & {
      items?: Array<{ id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
    };
    const uploadsPlaylist = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!channelResponse.ok || !uploadsPlaylist) {
      return NextResponse.json({ ok: false, message: "유튜브 채널 정보를 찾을 수 없습니다." }, { status: 502 });
    }

    const playlistUrl = new URL(`${YOUTUBE_API}/playlistItems`);
    playlistUrl.searchParams.set("part", "snippet");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylist);
    playlistUrl.searchParams.set("maxResults", "50");
    playlistUrl.searchParams.set("key", apiKey);
    const playlistResponse = await fetch(playlistUrl, { next: { revalidate: 21600 } });
    const playlistData = (await playlistResponse.json()) as YouTubeResponse;
    if (!playlistResponse.ok) {
      return NextResponse.json({ ok: false, message: "유튜브 영상을 불러오지 못했습니다." }, { status: 502 });
    }

    const videoIds = (playlistData.items ?? [])
      .map((item) => (item as { snippet?: { resourceId?: { videoId?: string } } }).snippet?.resourceId?.videoId)
      .filter((id): id is string => Boolean(id));
    const detailsUrl = new URL(`${YOUTUBE_API}/videos`);
    detailsUrl.searchParams.set("part", "contentDetails");
    detailsUrl.searchParams.set("id", videoIds.join(","));
    detailsUrl.searchParams.set("key", apiKey);
    const detailsResponse = await fetch(detailsUrl, { next: { revalidate: 21600 } });
    const detailsData = (await detailsResponse.json()) as VideoDetailsResponse;
    const durationById = new Map((detailsData.items ?? []).map((item) => [item.id, durationSeconds(item.contentDetails?.duration)]));

    const videos = (playlistData.items ?? [])
      .map((item) => {
        const id = item.snippet ? (item as { snippet?: { resourceId?: { videoId?: string } } }).snippet?.resourceId?.videoId : undefined;
        if (!id || !item.snippet?.title) return null;
        return {
          id,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt ?? null,
          thumbnail: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          isShort: (durationById.get(id) ?? 0) > 0 && (durationById.get(id) ?? 0) <= 180,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, videos }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200" } });
  } catch {
    return NextResponse.json({ ok: false, message: "유튜브 영상을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
