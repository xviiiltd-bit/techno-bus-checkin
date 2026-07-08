import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const { event_id } = await req.json();
    const eventId = String(event_id || "").trim();

    if (!eventId) {
      return Response.json({ success: false, message: "Missing event ID." }, { status: 400 });
    }

    const events = await base44.asServiceRole.entities.Events.filter({ event_id: eventId }, undefined, 1);
    const event = events?.[0] || null;

    return Response.json({
      success: true,
      event_id: eventId,
      event_name: event?.event_name || eventId,
      attendee_name: "Guest",
      total_checkins: 1,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.message || "Unable to load check-in details." },
      { status: 500 }
    );
  }
});
