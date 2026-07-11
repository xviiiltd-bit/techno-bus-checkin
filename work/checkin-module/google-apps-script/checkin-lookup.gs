const SPREADSHEET_ID = "1OfGGfOUqmpjDacvbq-0pVzPNz0LsjFZeXmBZxA4K39c";
const SHEET_NAME = "7/18";
const EVENT_ID = "techno-bus-2026-0718";

function doGet(event) {
  const query = String(event.parameter.query || "").trim();
  const eventId = String(event.parameter.eventId || EVENT_ID).trim();
  const callback = String(event.parameter.callback || "").trim();
  const payload = lookupRegistrations_(query, eventId);
  const body = callback
    ? `${callback}(${JSON.stringify(payload)})`
    : JSON.stringify(payload);

  return ContentService
    .createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function lookupRegistrations_(query, eventId) {
  if (!query) {
    return { ok: true, matches: [] };
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift();
  const rows = values.map((cells, index) => toRegistration_(headers, cells, index + 1, eventId))
    .filter((registration) => registration.name || registration.email);

  const normalizedQuery = query.toLowerCase();
  const emailMatches = rows.filter((registration) => registration.email.toLowerCase() === normalizedQuery);
  const matches = emailMatches.length
    ? emailMatches
    : rows.filter((registration) => registration.name === query);

  return {
    ok: true,
    matches: matches.map(toPublicRegistration_),
  };
}

function toRegistration_(headers, cells, index, eventId) {
  const row = {};
  headers.forEach((header, cellIndex) => {
    row[String(header).trim()] = String(cells[cellIndex] || "").trim();
  });

  return {
    id: `sheet-${index}`,
    eventId,
    name: row["姓名"] || row["中文姓名"] || row["報名名字"] || row["Name"] || row["name"] || "",
    email: row["Email"] || row["email"] || row["電子信箱"] || "",
    ticketType: row["票種"] || row["付款狀態"] || "一般票",
    totalCheckins: Number(row["報到次數"] || row["出席次數"] || 1),
  };
}

function toPublicRegistration_(registration) {
  return {
    id: registration.id,
    name: registration.name,
    maskedName: maskName_(registration.name),
    maskedEmail: maskEmail_(registration.email),
    ticketType: registration.ticketType,
    totalCheckins: registration.totalCheckins || 1,
  };
}

function maskName_(name) {
  if (!name) return "";
  if (name.length <= 2) return `${name.charAt(0)}x`;
  return `${name.charAt(0)}x${name.charAt(name.length - 1)}`;
}

function maskEmail_(email) {
  const parts = String(email || "").split("@");
  if (parts.length !== 2) return "";
  return `${parts[0].slice(0, 2)}***@${parts[1]}`;
}
