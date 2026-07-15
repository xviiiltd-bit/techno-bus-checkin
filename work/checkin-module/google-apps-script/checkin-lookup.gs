const SPREADSHEET_ID = "1OfGGfOUqmpjDacvbq-0pVzPNz0LsjFZeXmBZxA4K39c";
const SHEET_NAME = "7/18";
const EVENT_ID = "techno-bus-2026-0718";

function doGet(event) {
  const action = String(event.parameter.action || "lookup").trim();
  const query = String(event.parameter.query || "").trim();
  const eventId = String(event.parameter.eventId || EVENT_ID).trim();
  const registrationId = String(event.parameter.registrationId || "").trim();
  const callback = String(event.parameter.callback || "").trim();
  const payload = action === "checkin"
    ? markRegistrationCheckedIn_(registrationId, query, eventId)
    : lookupRegistrations_(query, eventId);
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

function markRegistrationCheckedIn_(registrationId, query, eventId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const range = sheet.getDataRange();
  const values = range.getDisplayValues();

  if (values.length < 2) {
    return { ok: false, error: "Sheet has no registration rows." };
  }

  const headers = values[0].map((header) => String(header).trim());
  const checkinColumn = ensureCheckinColumn_(sheet, headers);
  const targetRow = findTargetRow_(values, headers, registrationId, query, eventId);

  if (!targetRow) {
    return { ok: false, error: "Registration row not found." };
  }

  sheet.getRange(targetRow, checkinColumn).setValue("V");

  return {
    ok: true,
    registrationId,
    rowNumber: targetRow,
    checkedIn: "V",
  };
}

function ensureCheckinColumn_(sheet, headers) {
  const nameColumnIndex = findHeaderIndex_(headers, ["姓名", "中文姓名", "報名名字", "Name", "name"]);
  const vColumnIndex = headers.findIndex((header) => header === "V");

  if (vColumnIndex !== -1) {
    return vColumnIndex + 1;
  }

  const insertAfterColumn = nameColumnIndex !== -1 ? nameColumnIndex + 1 : sheet.getLastColumn();
  sheet.insertColumnAfter(insertAfterColumn);
  const newColumn = insertAfterColumn + 1;
  sheet.getRange(1, newColumn).setValue("V");
  return newColumn;
}

function findTargetRow_(values, headers, registrationId, query, eventId) {
  const idMatch = String(registrationId || "").match(/^sheet-(\d+)$/);
  if (idMatch) {
    const dataRowIndex = Number(idMatch[1]);
    const sheetRow = dataRowIndex + 1;
    if (sheetRow >= 2 && sheetRow <= values.length) {
      return sheetRow;
    }
  }

  if (!query) {
    return null;
  }

  const rows = values.slice(1).map((cells, index) => ({
    rowNumber: index + 2,
    registration: toRegistration_(headers, cells, index + 1, eventId),
  })).filter((row) => row.registration.name || row.registration.email);

  const normalizedQuery = query.toLowerCase();
  const emailMatch = rows.find((row) => row.registration.email.toLowerCase() === normalizedQuery);
  if (emailMatch) return emailMatch.rowNumber;

  const nameMatches = rows.filter((row) => row.registration.name === query);
  return nameMatches.length === 1 ? nameMatches[0].rowNumber : null;
}

function findHeaderIndex_(headers, candidates) {
  return headers.findIndex((header) => candidates.indexOf(String(header).trim()) !== -1);
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
