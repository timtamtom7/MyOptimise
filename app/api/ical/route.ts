import { NextResponse } from "next/server";
import { fetchSanitySignupsByEmail } from "@/sanity/lib/fetch";
import { cookies } from "next/headers";

function formatDateToICS(dateString: string | null | undefined) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const min = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  if (!email) {
    return new NextResponse("Missing email", { status: 400 });
  }

  const c = await (cookies as unknown as () => Promise<any>)();
  const locale = c?.get?.("lang")?.value || "en";
  const signups = await fetchSanitySignupsByEmail({ email, locale });
  const now = formatDateToICS(new Date().toISOString());
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://helpinghand.hk";

  let ics = "";
  ics += "BEGIN:VCALENDAR\r\n";
  ics += "VERSION:2.0\r\n";
  ics += "PRODID:-//Helping Hand//Calendar//EN\r\n";
  ics += "CALSCALE:GREGORIAN\r\n";
  ics += "METHOD:PUBLISH\r\n";
  ics += "X-WR-CALNAME:Helping Hand Volunteering\r\n";
  ics += "X-WR-TIMEZONE:UTC\r\n";

  for (const s of signups) {
    const start = formatDateToICS(s.event?.date);
    if (!start) continue;
    const startDate = new Date(s.event?.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const end = formatDateToICS(endDate.toISOString());
    const summary = (s.event?.title ?? "Volunteer Event").replace(/\n/g, " ");
    const location = (s.event?.location ?? "").replace(/\n/g, " ");
    const slug = s.event?.slug?.current;
    const urlField = slug ? `${site}/events/${slug}` : site;
    const uid = `${s._id}@helpinghand.hk`;

    ics += "BEGIN:VEVENT\r\n";
    ics += `UID:${uid}\r\n`;
    ics += `DTSTAMP:${now}\r\n`;
    ics += `DTSTART:${start}\r\n`;
    ics += `DTEND:${end}\r\n`;
    ics += `SUMMARY:${summary}\r\n`;
    if (location) ics += `LOCATION:${location}\r\n`;
    ics += `DESCRIPTION:${location ? location + " — " : ""}${urlField}\r\n`;
    ics += "END:VEVENT\r\n";
  }

  ics += "END:VCALENDAR\r\n";

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="helpinghand-${encodeURIComponent(
        email
      )}.ics"`,
    },
  });
}
