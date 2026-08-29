import { getSupabaseAdminClient, getSupabasePublicClient, hasSupabaseEnv } from "./supabase";
import type { Database, Json } from "./database.types";
import { sanitizeRichText, type RichTextDocument } from "./rich-text";

type BulletinRow = Database["public"]["Tables"]["weekly_bulletins"]["Row"];

export type Bulletin = Omit<BulletinRow, "column_content_rich"> & {
  column_content_rich: RichTextDocument | null;
};

export type BulletinInput = {
  serviceDate: string;
  scriptureReference: string;
  messageTitle: string;
  columnContent: string;
  columnContentRich: RichTextDocument;
  weeklyNotice: string;
};

export function formatBulletinDate(date: string, locale = "ko-KR") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(date));
}

export function buildBulletinSlug(serviceDate: string) {
  return serviceDate;
}

function toBulletin(row: BulletinRow): Bulletin {
  return {
    ...row,
    column_content_rich: sanitizeRichText(row.column_content_rich),
  };
}

function richTextToJson(document: RichTextDocument): Json {
  return JSON.parse(JSON.stringify(document)) as Json;
}

export async function fetchLatestBulletin() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("weekly_bulletins")
    .select("*")
    .eq("published", true)
    .order("service_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toBulletin(data) : null;
}

export async function fetchPublishedBulletins() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("weekly_bulletins")
    .select("*")
    .eq("published", true)
    .order("service_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toBulletin);
}

export async function fetchBulletinBySlug(slug: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("weekly_bulletins")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toBulletin(data) : null;
}

export async function fetchRecentAdminBulletins() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("weekly_bulletins")
    .select("*")
    .order("service_date", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toBulletin);
}

export async function insertBulletin(input: BulletinInput) {
  const supabase = getSupabaseAdminClient();
  const slug = buildBulletinSlug(input.serviceDate);

  const { data, error } = await supabase
    .from("weekly_bulletins")
    .insert({
      slug,
      service_date: input.serviceDate,
      scripture_reference: input.scriptureReference,
      message_title: input.messageTitle,
      column_content: input.columnContent,
      column_content_rich: richTextToJson(input.columnContentRich),
      weekly_notice: input.weeklyNotice || null,
      published: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toBulletin(data);
}

export async function updateBulletin(id: string, input: BulletinInput) {
  const supabase = getSupabaseAdminClient();
  const slug = buildBulletinSlug(input.serviceDate);

  const { data, error } = await supabase
    .from("weekly_bulletins")
    .update({
      slug,
      service_date: input.serviceDate,
      scripture_reference: input.scriptureReference,
      message_title: input.messageTitle,
      column_content: input.columnContent,
      column_content_rich: richTextToJson(input.columnContentRich),
      weekly_notice: input.weeklyNotice || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toBulletin(data);
}

export async function deleteBulletin(id: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("weekly_bulletins").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
