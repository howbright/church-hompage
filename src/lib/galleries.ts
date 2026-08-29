import "server-only";

import { getSupabaseAdminClient, hasSupabaseEnv } from "./supabase";
import type { Database } from "./database.types";

export const GALLERY_BUCKET = "gallery-media";

export type GalleryVisibility =
  Database["public"]["Enums"]["gallery_visibility"];

type GalleryEntryRow =
  Database["public"]["Tables"]["gallery_entries"]["Row"];
type GalleryEntryInsert =
  Database["public"]["Tables"]["gallery_entries"]["Insert"];
type GalleryPhotoRow =
  Database["public"]["Tables"]["gallery_photos"]["Row"];

export type GalleryPhoto = GalleryPhotoRow & {
  signed_url?: string;
};

export type GalleryEntry = GalleryEntryRow & {
  gallery_photos: GalleryPhoto[];
};

export type GalleryPhotoInput = Pick<
  GalleryPhoto,
  | "storage_path"
  | "sort_order"
  | "alt_text"
  | "caption"
  | "width"
  | "height"
  | "mime_type"
  | "file_size"
>;

export type GalleryEntryInput = {
  title: string;
  description: string;
  eventDate: string;
  dateLabel: string;
  visibility: GalleryVisibility;
  containsMinors: boolean;
  consentConfirmed: boolean;
  photos: GalleryPhotoInput[];
};

function sortPhotos(entry: GalleryEntry) {
  return {
    ...entry,
    gallery_photos: [...(entry.gallery_photos ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order,
    ),
  };
}

async function attachSignedUrls(entries: GalleryEntry[]) {
  const supabase = getSupabaseAdminClient();
  return Promise.all(
    entries.map(async (rawEntry) => {
      const entry = sortPhotos(rawEntry);
      const photos = await Promise.all(
        entry.gallery_photos.map(async (photo) => {
          const { data, error } = await supabase.storage
            .from(GALLERY_BUCKET)
            .createSignedUrl(photo.storage_path, 60 * 60);

          if (error) return photo;
          return { ...photo, signed_url: data.signedUrl };
        }),
      );

      return { ...entry, gallery_photos: photos };
    }),
  );
}

export async function fetchGalleryEntries(memberAccess: boolean) {
  if (!hasSupabaseEnv()) return [];

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("gallery_entries")
    .select("*, gallery_photos(*)")
    .order("event_date", { ascending: false })
    .order("published_at", { ascending: false });

  query = memberAccess
    ? query.in("visibility", ["public", "members"])
    : query.eq("visibility", "public");

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachSignedUrls(data ?? []);
}

export async function fetchAdminGalleryEntries() {
  if (!hasSupabaseEnv()) return [];
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gallery_entries")
    .select("*, gallery_photos(*)")
    .order("event_date", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return attachSignedUrls(data ?? []);
}

export async function saveGalleryEntry(id: string, input: GalleryEntryInput) {
  const supabase = getSupabaseAdminClient();
  const entryValues: GalleryEntryInsert = {
    title: input.title,
    description: input.description || null,
    event_date: input.eventDate,
    date_label: input.dateLabel || null,
    visibility: input.visibility,
    contains_minors: input.containsMinors,
    consent_confirmed: input.consentConfirmed,
  };

  let entryId = id;
  let removedPaths: string[] = [];

  if (entryId) {
    const { data: currentPhotos, error: photoReadError } = await supabase
      .from("gallery_photos")
      .select("storage_path")
      .eq("entry_id", entryId);
    if (photoReadError) throw new Error(photoReadError.message);

    const nextPaths = new Set(input.photos.map((photo) => photo.storage_path));
    removedPaths = (currentPhotos ?? [])
      .map((photo) => photo.storage_path)
      .filter((path) => !nextPaths.has(path));

    const { error } = await supabase
      .from("gallery_entries")
      .update(entryValues)
      .eq("id", entryId);
    if (error) throw new Error(error.message);

    const { error: deleteError } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("entry_id", entryId);
    if (deleteError) throw new Error(deleteError.message);
  } else {
    const { data, error } = await supabase
      .from("gallery_entries")
      .insert(entryValues)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    entryId = data.id;
  }

  const { error: photoError } = await supabase.from("gallery_photos").insert(
    input.photos.map((photo) => ({
      ...photo,
      entry_id: entryId,
    })),
  );
  if (photoError) throw new Error(photoError.message);

  if (removedPaths.length) {
    await supabase.storage.from(GALLERY_BUCKET).remove(removedPaths);
  }

  return entryId;
}

export async function deleteGalleryEntry(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data: photos, error: photoError } = await supabase
    .from("gallery_photos")
    .select("storage_path")
    .eq("entry_id", id);
  if (photoError) throw new Error(photoError.message);

  const { error } = await supabase.from("gallery_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const paths = (photos ?? []).map((photo) => photo.storage_path);
  if (paths.length) await supabase.storage.from(GALLERY_BUCKET).remove(paths);
}

export function formatGalleryDate(entry: Pick<GalleryEntry, "event_date" | "date_label">) {
  if (entry.date_label) return entry.date_label;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${entry.event_date}T00:00:00+09:00`));
}
