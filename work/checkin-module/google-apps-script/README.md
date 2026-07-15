# Techno Bus Google Sheet check-in lookup

Use `checkin-lookup.gs` as a Google Apps Script Web App that searches the private Google Sheet without exposing the full attendee list to the public website. It also marks successful check-ins back to the sheet.

## Deploy steps

1. Open the Google Sheet: `TaipeiMix x Techno bus`.
2. Go to Extensions → Apps Script.
3. Paste `checkin-lookup.gs`.
4. Deploy → New deployment → Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Copy the Web App URL.
8. Put that URL into `registrationLookupEndpoint` in `docs/index.html`.
9. After editing `checkin-lookup.gs`, deploy a new Web App version so the public site can use the latest lookup/write logic.

The public page uses JSONP, so the browser does not download the full sheet. It sends only `eventId` and the attendee's query, then receives only masked match data.

## Check-in write-back

When staff/attendee confirms a matched registration, the public page calls the same Web App with `action=checkin`. The script finds the exact `sheet-*` row returned by lookup, creates a `V` column next to the name column if it does not exist, and writes `V` on that row.
