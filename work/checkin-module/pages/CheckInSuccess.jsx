import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Gift, Instagram, Sparkles, Youtube } from "lucide-react";
import { base44 } from "@/api/base44Client";

const copy = {
  zh: {
    toggle: "EN",
    route: "Techno Bus 入場完成",
    pass: "已登車",
    eyebrow: "報到成功",
    title: "報到成功，歡迎回到 Techno Bus。",
    loading: "正在載入報到資訊...",
    event: "活動",
    attendee: "來賓",
    attendance: "出席次數",
    attendanceLine: (count) => `你已參加我們 ${count} 場活動。`,
    attendanceCount: (count) => `${count} 場`,
    follow: "報到後追蹤品牌方",
    luckyDraw: "參加抽獎",
    back: "返回報到頁",
    guest: "來賓",
  },
  en: {
    toggle: "中文",
    route: "Techno Bus Entry Complete",
    pass: "Boarded",
    eyebrow: "Check-in successful",
    title: "Check-in successful. Welcome back to Techno Bus.",
    loading: "Loading your check-in details...",
    event: "Event",
    attendee: "Attendee",
    attendance: "Attendance",
    attendanceLine: (count) => `You have attended ${count} event(s) with us.`,
    attendanceCount: (count) => `${count} event(s)`,
    follow: "Follow our brands after check-in",
    luckyDraw: "Enter Lucky Draw",
    back: "Back to check-in",
    guest: "Guest",
  },
};

const socialLinks = [
  { label: "Techno bus", href: "#" },
  { label: "NextStop studio", href: "#" },
  { label: "NextStop YouTube", href: "#", icon: Youtube },
  { label: "HENDUO MUSIC", href: "#", icon: Instagram },
];

export default function CheckInSuccess() {
  const { eventId } = useParams();
  const location = useLocation();
  const [language, setLanguage] = useState("zh");
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const t = copy[language];

  useEffect(() => {
    let isMounted = true;

    async function loadSuccessData() {
      const cached = sessionStorage.getItem(`checkin_success_${eventId}`);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const response = await base44.functions.invoke("get-checkin-success", {
          event_id: eventId,
        });
        const result = response?.data || response;
        if (isMounted) {
          setData(result);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSuccessData();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#39FF14]/20 bg-[#101417] p-6 text-center shadow-2xl shadow-[#39FF14]/10 backdrop-blur">
          <div className="pointer-events-none absolute -left-16 top-20 h-40 w-56 rounded-[2.5rem] border border-[#39FF14]/15 bg-[#39FF14]/5" />
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

          <div className="relative mb-6 flex items-center justify-between rounded-2xl border border-[#39FF14]/15 bg-black/25 px-4 py-3 text-left">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {t.route}
            </span>
            <span className="rounded-full bg-[#39FF14]/15 px-3 py-1 text-[10px] font-semibold text-[#39FF14]">
              {t.pass}
            </span>
          </div>

          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#39FF14]/15">
            <Sparkles className="h-8 w-8 text-[#39FF14]" />
          </div>

          <p className="relative mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#39FF14]">
            {t.eyebrow}
          </p>
          <h1 className="relative text-3xl font-bold leading-tight">{t.title}</h1>

          {loading ? (
            <p className="mt-6 text-sm text-white/50">{t.loading}</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm text-white/45">{t.event}</p>
                <p className="mt-1 text-lg font-semibold">{data?.event_name || eventId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-sm text-white/45">{t.attendee}</p>
                  <p className="mt-1 truncate text-base font-semibold">{data?.attendee_name || t.guest}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-sm text-white/45">{t.attendance}</p>
                  <p className="mt-1 text-base font-semibold">
                    {t.attendanceCount(Number(data?.total_checkins || 1))}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-white/60">
                {t.attendanceLine(Number(data?.total_checkins || 1))}
              </p>
            </div>
          )}

          <div className="mt-8">
            <p className="mb-3 text-sm font-medium text-white/70">{t.follow}</p>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 text-sm font-medium transition hover:bg-white/15"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#39FF14] text-base font-semibold text-black shadow-lg shadow-[#39FF14]/20 transition hover:bg-[#65ff45]"
            onClick={() => {
              // Placeholder: route to lucky draw module after RewardRecords flow is connected.
            }}
          >
            <Gift className="h-5 w-5" />
            {t.luckyDraw}
          </button>

          <Link
            to={`/checkin/${eventId}`}
            className="mt-4 inline-block text-xs font-medium text-white/40 underline-offset-4 hover:text-white/70 hover:underline"
          >
            {t.back}
          </Link>
        </section>
      </div>
    </main>
  );
}
