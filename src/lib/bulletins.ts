import { getSupabaseAdminClient, getSupabasePublicClient, hasSupabaseEnv } from "./supabase";

export type Bulletin = {
  id: string;
  slug: string;
  service_date: string;
  scripture_reference: string;
  message_title: string;
  column_content: string;
  weekly_notice: string | null;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type BulletinInput = {
  serviceDate: string;
  scriptureReference: string;
  messageTitle: string;
  columnContent: string;
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
    .maybeSingle<Bulletin>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
    .order("service_date", { ascending: false })
    .returns<Bulletin[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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
    .maybeSingle<Bulletin>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
    .limit(10)
    .returns<Bulletin[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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
      weekly_notice: input.weeklyNotice || null,
      published: true,
    })
    .select("*")
    .single<Bulletin>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
      weekly_notice: input.weeklyNotice || null,
    })
    .eq("id", id)
    .select("*")
    .single<Bulletin>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBulletin(id: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("weekly_bulletins").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
