export type BibleCollegeCourse = {
  id: string;
  name: string;
  description: string;
};

export type BibleCollegeInstructor = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_path: string | null;
  photo_alt: string;
  photo_url?: string;
};

export type BibleCollegeNotice = {
  id: string;
  title: string;
  body: string;
  date: string;
};

export type BibleCollegeCalendarEvent = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
};

export type BibleCollegeContent = {
  introduction: string;
  semester_name: string;
  curriculum: BibleCollegeCourse[];
  instructors: BibleCollegeInstructor[];
  student_photo_path: string | null;
  student_photo_alt: string;
  student_photo_caption: string;
  student_photo_url?: string;
  notices: BibleCollegeNotice[];
  calendar_events: BibleCollegeCalendarEvent[];
  inquiry_email: string;
  address: string;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function id(value: unknown, fallback: string) {
  const normalized = text(value, 100);
  return normalized || fallback;
}

function date(value: unknown) {
  const normalized = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

export function parseBibleCollegeCourses(value: unknown): BibleCollegeCourse[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const course = item as Record<string, unknown>;
    const name = text(course.name, 120);
    if (!name) return [];
    return [{
      id: id(course.id, `course-${index}`),
      name,
      description: text(course.description, 1000),
    }];
  });
}

export function parseBibleCollegeInstructors(
  value: unknown,
): BibleCollegeInstructor[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const instructor = item as Record<string, unknown>;
    const name = text(instructor.name, 80);
    if (!name) return [];
    return [{
      id: id(instructor.id, `instructor-${index}`),
      name,
      role: text(instructor.role, 100),
      bio: text(instructor.bio, 3000),
      photo_path: text(instructor.photo_path, 500) || null,
      photo_alt: text(instructor.photo_alt, 300),
    }];
  });
}

export function parseBibleCollegeNotices(value: unknown): BibleCollegeNotice[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const notice = item as Record<string, unknown>;
    const title = text(notice.title, 160);
    if (!title) return [];
    return [{
      id: id(notice.id, `notice-${index}`),
      title,
      body: text(notice.body, 5000),
      date: date(notice.date),
    }];
  });
}

export function parseBibleCollegeEvents(
  value: unknown,
): BibleCollegeCalendarEvent[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const event = item as Record<string, unknown>;
    const title = text(event.title, 160);
    const startDate = date(event.start_date);
    if (!title || !startDate) return [];
    const endDate = date(event.end_date) || startDate;
    return [{
      id: id(event.id, `event-${index}`),
      title,
      start_date: startDate,
      end_date: endDate < startDate ? startDate : endDate,
      description: text(event.description, 2000),
    }];
  });
}
