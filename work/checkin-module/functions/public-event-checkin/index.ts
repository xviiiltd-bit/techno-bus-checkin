import { createClientFromRequest } from "npm:@base44/sdk";

type CheckInRequest = {
  event_id: string;
  lookup?: string;
  selected_registration_id?: string | null;
};

function normalize(value?: string) {
  return String(value || "").trim();
}

function isEmail(value: string) {
  return value.includes("@");
}

function maskName(name?: string) {
  const value = normalize(name);
  if (value.length <= 1) return value;
  if (value.length === 2) return `${value[0]}x`;
  return `${value[0]}x${value[value.length - 1]}`;
}

function maskEmail(email?: string) {
  const value = normalize(email);
  const [local, domain] = value.split("@");
  if (!local || !domain) return "";
  return `${local.slice(0, 2)}***@${domain}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const now = new Date().toISOString();

  try {
    const body = (await req.json()) as CheckInRequest;
    const eventId = normalize(body.event_id);
    const lookup = normalize(body.lookup);
    const selectedRegistrationId = normalize(body.selected_registration_id || "");

    if (!eventId) {
      return Response.json({ success: false, message: "Missing event ID." }, { status: 400 });
    }

    if (!lookup && !selectedRegistrationId) {
      return Response.json({ success: false, message: "Please enter email or Chinese name." }, { status: 400 });
    }

    const events = await base44.asServiceRole.entities.Events.filter({ event_id: eventId }, undefined, 1);
    const event = events?.[0] || null;

    let registrations = [];

    if (selectedRegistrationId) {
      const selected = await base44.asServiceRole.entities.EventRegistrations.get(selectedRegistrationId);
      registrations = selected && selected.event_id === eventId ? [selected] : [];
    } else if (isEmail(lookup)) {
      registrations = await base44.asServiceRole.entities.EventRegistrations.filter(
        { event_id: eventId, email: lookup.toLowerCase() },
        undefined,
        10
      );
    }

    if (!registrations.length && lookup && !isEmail(lookup)) {
      registrations = await base44.asServiceRole.entities.EventRegistrations.filter(
        { event_id: eventId, name: lookup },
        undefined,
        10
      );

      if (registrations.length > 1) {
        return Response.json({
          success: false,
          status: "duplicate_name",
          matches: registrations.map((registration) => ({
            registration_id: registration.id,
            masked_name: maskName(registration.name),
            masked_email: maskEmail(registration.email),
            ticket_type: registration.ticket_type,
          })),
        });
      }
    }

    const registration = registrations?.[0];

    if (!registration) {
      return Response.json({ success: false, status: "not_found", message: "Registration not found." }, { status: 404 });
    }

    if (registration.checked_in) {
      return Response.json({
        success: false,
        status: "already_checked_in",
        message: "You have already checked in for this event.",
      });
    }

    const existingCheckInRecords = await base44.asServiceRole.entities.CheckInRecords.filter(
      { event_id: eventId, registration_id: registration.id },
      undefined,
      1
    );

    if (existingCheckInRecords?.[0]) {
      return Response.json({
        success: false,
        status: "already_checked_in",
        message: "You have already checked in for this event.",
      });
    }

    const memberFilters = [];
    if (registration.email) memberFilters.push({ email: String(registration.email).toLowerCase() });
    if (registration.phone) memberFilters.push({ phone: registration.phone });
    if (!memberFilters.length && registration.name) memberFilters.push({ name: registration.name });

    let member = null;
    for (const filter of memberFilters) {
      const matches = await base44.asServiceRole.entities.Member.filter(filter, undefined, 1);
      if (matches?.[0]) {
        member = matches[0];
        break;
      }
    }

    if (!member) {
      member = await base44.asServiceRole.entities.Member.create({
        name: registration.name || lookup,
        email: registration.email ? String(registration.email).toLowerCase() : "",
        phone: registration.phone || "",
        total_checkins: 0,
        event_tags: "",
        reward_history: "",
        created_at: now,
        updated_at: now,
      });
    }

    const nextTotalCheckins = Number(member.total_checkins || 0) + 1;
    const currentTags = String(member.event_tags || member.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const eventTag = event?.event_name || eventId;
    const nextTags = Array.from(new Set([...currentTags, eventTag])).join(", ");

    await base44.asServiceRole.entities.EventRegistrations.update(registration.id, {
      checked_in: true,
      checkin_time: now,
      member_id: member.id,
    });

    await base44.asServiceRole.entities.CheckInRecords.create({
      event_id: eventId,
      member_id: member.id,
      registration_id: registration.id,
      checkin_time: now,
      checkin_method: selectedRegistrationId ? "staff_confirmed_name" : isEmail(lookup) ? "email" : "name",
      checked_in_by: "public_checkin",
      created_at: now,
    });

    await base44.asServiceRole.entities.Member.update(member.id, {
      total_checkins: nextTotalCheckins,
      last_event_attended: event?.event_name || eventId,
      last_checkin_date: now,
      event_tags: nextTags,
      updated_at: now,
    });

    return Response.json({
      success: true,
      status: "checked_in",
      event_id: eventId,
      event_name: event?.event_name || eventId,
      attendee_name: registration.name || member.name || "Guest",
      member_id: member.id,
      registration_id: registration.id,
      total_checkins: nextTotalCheckins,
      checkin_time: now,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.message || "Check-in failed." },
      { status: 500 }
    );
  }
});
