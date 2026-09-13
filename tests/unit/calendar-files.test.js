import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const readBuffer = (path) => readFileSync(new URL(`../../${path}`, import.meta.url));
const readText = (path) => readBuffer(path).toString("utf8");
const unfold = (text) => text.replace(/\r\n[ \t]/g, "");

const calendars = [
  {
    route: "hannah",
    path: "hannah/assets/hannah-7-anos.ics",
    href: "./assets/hannah-7-anos.ics",
    summary: "Aniversário de Hannah Lis — 7 anos",
    start: "20260926T090000",
    end: "20260926T120000",
  },
  {
    route: "vagner",
    path: "vagner/assets/vagner-42-anos.ics",
    href: "./assets/vagner-42-anos.ics",
    summary: "Aniversário de Vagner Cunha — 42 anos",
    start: "20260926T090000",
    end: "20260926T120000",
  },
  {
    route: "noah",
    path: "noah/assets/noah-10-anos.ics",
    href: "./assets/noah-10-anos.ics",
    summary: "Aniversário de Heitor Noah — 10 anos",
    start: "20260926T150000",
    end: "20260926T180000",
  },
];

describe("arquivos de calendário dos convites", () => {
  it.each(calendars)("mantém o evento de $route completo e canônico", (calendar) => {
    const source = readText(calendar.path);
    const content = unfold(source);

    expect(source.replace(/\r\n/g, "")).not.toContain("\n");
    expect(content).toContain("BEGIN:VCALENDAR\r\n");
    expect(content).toContain("VERSION:2.0\r\n");
    expect(content).toContain("BEGIN:VTIMEZONE\r\n");
    expect(content).toContain("TZID:America/Fortaleza\r\n");
    expect(content).toContain("BEGIN:VEVENT\r\n");
    expect(content).toContain(`DTSTART;TZID=America/Fortaleza:${calendar.start}\r\n`);
    expect(content).toContain(`DTEND;TZID=America/Fortaleza:${calendar.end}\r\n`);
    expect(content).toContain(`SUMMARY:${calendar.summary}\r\n`);
    expect(content).toContain("LOCATION:Sítio Geladão\r\n");
    expect(content).toContain("Google Maps: https://maps.app.goo.gl/ZvDD1xucfFxfN2iw8");
    expect(content).toContain("END:VEVENT\r\n");
    expect(content).toContain("END:VCALENDAR\r\n");
    expect(content).not.toContain("BEGIN:VALARM");
    expect(content).not.toContain("RRULE:");
    expect(content).not.toContain("14h");
    expect(content).not.toContain("14:00");
    expect(content).not.toContain("Sítio Jalisco");
    expect(content).not.toContain("N6HcsDhRMRoWT4E1A");

    const html = readText(`${calendar.route}/index.html`);
    expect(html).toContain(`data-calendar-link href="${calendar.href}"`);
  });

  it("usa UIDs estáveis e distintos", () => {
    const uids = calendars.map(({ path }) => unfold(readText(path)).match(/^UID:(.+)$/m)?.[1].trim());
    expect(uids.every(Boolean)).toBe(true);
    expect(new Set(uids).size).toBe(calendars.length);
  });
});
