import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Loader2, Mail, UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";

const copy = {
  zh: {
    toggle: "EN",
    route: "Techno Bus 入場路線",
    pass: "登車報到證",
    eyebrow: "TECHNO BUS 報到",
    headline: "歡迎上車",
    headlineSub: "請輸入 Email 或中文姓名完成入場報到。",
    helper: "此頁面用於活動入口報到。你的資料只會用於確認出席紀錄。",
    fieldLabel: "Email 或中文姓名",
    placeholder: "Email 或中文姓名",
    emptyError: "請輸入 Email 或中文姓名。",
    duplicateError: "找到多筆同名報名資料，請由工作人員確認正確來賓。",
    alreadyCheckedIn: "你已經完成本場活動報到。",
    notFound: "找不到報名資料，請洽活動工作人員協助。",
    failed: "報到失敗，請再試一次或洽工作人員協助。",
    staffRequired: "需要工作人員確認",
    noEmail: "無 Email",
    ticket: "票種",
    loading: "報到中...",
    submit: "完成入場報到",
    eventId: "活動 ID",
  },
  en: {
    toggle: "中文",
    route: "Techno Bus Entry Route",
    pass: "Boarding Check-in Pass",
    eyebrow: "Techno Bus Check-in",
    headline: "Welcome aboard.",
    headlineSub: "Please enter your email or Chinese name to check in.",
    helper: "This page is for event entrance check-in. Your information will only be used to confirm attendance.",
    fieldLabel: "Email or Chinese name",
    placeholder: "Email or Chinese name",
    emptyError: "Please enter your email or Chinese name.",
    duplicateError: "Multiple registrations found. Please ask staff to confirm the correct attendee.",
    alreadyCheckedIn: "You have already checked in for this event.",
    notFound: "Registration not found. Please ask event staff for help.",
    failed: "Check-in failed. Please try again or ask staff for help.",
    staffRequired: "Staff confirmation required",
    noEmail: "No email",
    ticket: "Ticket",
    loading: "Checking in...",
    submit: "Check in",
    eventId: "Event ID",
    qr: "QR entry",
    crm: "Members CRM linked",
  },
};

export default function EventCheckIn() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("zh");
  const [lookup, setLookup] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState([]);

  const t = copy[language];
  const normalizedLookup = lookup.trim();
  const isEmail = normalizedLookup.includes("@");

  async function submitCheckIn(selectedRegistrationId = null) {
    if (!normalizedLookup && !selectedRegistrationId) {
      setError(t.emptyError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await base44.functions.invoke("public-event-checkin", {
        event_id: eventId,
        lookup: normalizedLookup,
        selected_registration_id: selectedRegistrationId,
      });

      const result = response?.data || response;

      if (result?.status === "duplicate_name") {
        setDuplicateMatches(result.matches || []);
        setError(t.duplicateError);
        return;
      }

      if (result?.status === "already_checked_in") {
        setError(t.alreadyCheckedIn);
        return;
      }

      if (!result?.success) {
        setError(result?.message || t.notFound);
        return;
      }

      sessionStorage.setItem(
        `checkin_success_${eventId}`,
        JSON.stringify({
          event_name: result.event_name,
          attendee_name: result.attendee_name,
          total_checkins: result.total_checkins,
          member_id: result.member_id,
          checkin_time: result.checkin_time,
        })
      );

      navigate(`/checkin-success/${eventId}`, {
        replace: true,
        state: {
          event_name: result.event_name,
          attendee_name: result.attendee_name,
          total_checkins: result.total_checkins,
          member_id: result.member_id,
        },
      });
    } catch (err) {
      setError(err?.message || t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#39FF14]/20 bg-[#101417] p-6 shadow-2xl shadow-[#39FF14]/10 backdrop-blur">
          <div className="pointer-events-none absolute -right-10 top-16 h-32 w-52 rounded-[2rem] border border-[#39FF14]/20 bg-[#39FF14]/5" />
          <div className="pointer-events-none absolute right-8 top-24 h-8 w-24 rounded-full border border-[#39FF14]/25" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#39FF14]/50 to-transparent" />

          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-[#39FF14]"
            >
              {t.toggle}
            </button>
          </div>

          <div className="relative mb-8 space-y-3">
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#39FF14]/15 bg-black/25 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                {t.route}
              </span>
              <span className="rounded-full bg-[#39FF14]/15 px-3 py-1 text-[10px] font-semibold text-[#39FF14]">
                {t.pass}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#39FF14]">
              {t.eyebrow}
            </p>
            <h1 className="text-3xl font-bold leading-tight">
              {t.headline}
              <br />
              {t.headlineSub}
            </h1>
            <p className="text-sm leading-6 text-white/60">
              {t.helper}
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitCheckIn();
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">{t.fieldLabel}</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-black/30 px-4 focus-within:border-[#39FF14]">
                {isEmail ? (
                  <Mail className="h-5 w-5 text-white/40" />
                ) : (
                  <UserRound className="h-5 w-5 text-white/40" />
                )}
                <input
                  value={lookup}
                  onChange={(event) => {
                    setLookup(event.target.value);
                    setDuplicateMatches([]);
                    setError("");
                  }}
                  placeholder={t.placeholder}
                  className="h-14 w-full bg-transparent px-3 text-base text-white outline-none placeholder:text-white/30"
                  autoCapitalize="none"
                  autoComplete="email name"
                  inputMode={isEmail ? "email" : "text"}
                />
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-5 text-amber-100">
                {error}
              </div>
            )}

            {duplicateMatches.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="px-1 text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                  {t.staffRequired}
                </p>
                {duplicateMatches.map((match) => (
                  <button
                    key={match.registration_id}
                    type="button"
                    disabled={loading}
                    onClick={() => submitCheckIn(match.registration_id)}
                    className="flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-left transition hover:bg-white/15 disabled:opacity-60"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{match.masked_name}</span>
                      <span className="block text-xs text-white/50">
                        {match.masked_email || t.noEmail} · {match.ticket_type || t.ticket}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#39FF14]" />
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !normalizedLookup}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#39FF14] text-base font-semibold text-black shadow-lg shadow-[#39FF14]/20 transition hover:bg-[#65ff45] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.loading}
                </>
              ) : (
                <>
                  {t.submit}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-white/35">
            {t.eventId}: {eventId}
          </p>
        </section>
      </div>
    </main>
  );
}
