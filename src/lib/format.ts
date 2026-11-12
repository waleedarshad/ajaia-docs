// Formatted on the server in UTC so the output is stable between server and client renders.
const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function formatUpdated(date: Date): string {
  return `${fmt.format(date)} UTC`;
}
