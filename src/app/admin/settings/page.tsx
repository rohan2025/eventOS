"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdminUser } from "../auth-context";

interface AdminEntry {
  email: string;
  added_by: string | null;
  created_at: string;
}

// Super admins from env are shown as "Core" (non-removable from the UI —
// they're env-configured, not DB-managed). All other admins come from
// the `admins` table and can be removed.
const CORE_ADMINS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const ALLOWED_DOMAIN = (process.env.NEXT_PUBLIC_ALLOWED_ADMIN_DOMAIN || "").toLowerCase().trim();

type OtpStep = "idle" | "sending" | "sent" | "verifying";

export default function SettingsPage() {
  const adminUser = useAdminUser();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add admin flow
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect non-admins
  useEffect(() => {
    if (adminUser && adminUser.role !== "super_admin") {
      router.push("/admin");
    }
  }, [adminUser, router]);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    };
  }

  async function loadAdmins() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/admins", { headers });
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins || []);
    }
    setLoading(false);
  }

  async function handleSendOtp() {
    if (!newAdminEmail.trim()) return;
    setOtpStep("sending");
    setAdminError("");
    setAdminSuccess("");

    const headers = await getAuthHeaders();
    const res = await fetch("/api/admins/send-otp", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: newAdminEmail.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      setOtpStep("sent");
      setOtpCode(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setAdminError(data.error || "Failed to send verification code");
      setOtpStep("idle");
    }
  }

  async function handleVerifyOtp() {
    const code = otpCode.join("");
    if (code.length !== 6) return;
    setOtpStep("verifying");
    setAdminError("");

    const headers = await getAuthHeaders();
    const res = await fetch("/api/admins/verify-otp", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: newAdminEmail.trim(), code }),
    });

    const data = await res.json();
    if (res.ok) {
      setAdminSuccess(`${newAdminEmail} added as admin`);
      setNewAdminEmail("");
      setOtpStep("idle");
      setOtpCode(["", "", "", "", "", ""]);
      await loadAdmins();
      setTimeout(() => setAdminSuccess(""), 4000);
    } else {
      setAdminError(data.error || "Verification failed");
      setOtpStep("sent");
    }
  }

  function handleOtpInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        setTimeout(() => handleVerifyOtp(), 150);
      }
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const newCode = pasted.split("");
      setOtpCode(newCode);
      otpRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOtp(), 150);
    }
  }

  function resetAddFlow() {
    setNewAdminEmail("");
    setOtpStep("idle");
    setOtpCode(["", "", "", "", "", ""]);
    setAdminError("");
    setAdminSuccess("");
  }

  async function handleRemoveAdmin(email: string) {
    const confirmed = window.confirm(`Remove ${email} as admin?`);
    if (!confirmed) return;

    const headers = await getAuthHeaders();
    const res = await fetch("/api/admins", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      await loadAdmins();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to remove admin");
    }
  }

  if (!adminUser || adminUser.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="neon-loader" />
      </div>
    );
  }

  // Merge core + dynamic admins
  const allAdmins = [
    ...CORE_ADMINS.map((email) => ({
      email,
      added_by: null as string | null,
      created_at: "",
      isCore: true,
    })),
    ...admins
      .filter((a) => !CORE_ADMINS.includes(a.email.toLowerCase()))
      .map((a) => ({ ...a, isCore: false })),
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#000000] tracking-tight mb-1">
        Settings
      </h1>
      <p className="text-sm text-[#0a0a0a]/60 mb-8">
        Manage who has admin access to the Event Dashboard
      </p>

      {/* ── Admin list ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-[#0a0a0a]/50 uppercase tracking-wider">
            Team ({allAdmins.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="neon-loader" />
          </div>
        ) : (
          <div className="bg-[#ffffff] rounded-2xl border border-[#0a0a0a]/8 overflow-hidden divide-y divide-[#0a0a0a]/5">
            {allAdmins.map((admin) => (
              <div
                key={admin.email}
                className="flex items-center justify-between py-3.5 px-5 hover:bg-[#ffffff]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      admin.isCore
                        ? "bg-[#0a0a0a] text-[#facc15]"
                        : "bg-[#facc15] text-[#0a0a0a]"
                    }`}
                  >
                    {admin.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#000000] truncate">
                      {admin.email}
                    </p>
                    <p className="text-[10px] text-[#0a0a0a]/50">
                      {admin.isCore
                        ? "Core admin"
                        : admin.added_by
                          ? `Added by ${admin.added_by.split("@")[0]}${
                              admin.created_at
                                ? ` · ${new Date(admin.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                                : ""
                            }`
                          : "Admin"}
                    </p>
                  </div>
                </div>

                {admin.isCore ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#0a0a0a]/6 text-[#0a0a0a]/55 font-medium flex-shrink-0">
                    Core
                  </span>
                ) : (
                  <button
                    onClick={() => handleRemoveAdmin(admin.email)}
                    className="text-[11px] text-[#0a0a0a]/40 hover:text-red-500 transition-colors font-medium flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Add admin with OTP ── */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-[#0a0a0a]/50 uppercase tracking-wider mb-4">
          Add Admin
        </h2>

        <div className="bg-[#ffffff] rounded-2xl border border-[#0a0a0a]/8 p-5">
          {/* Success message */}
          {adminSuccess && (
            <div className="mb-4 flex items-center gap-2 py-2.5 px-4 rounded-xl bg-green-50 border border-green-200">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700 font-medium">{adminSuccess}</span>
            </div>
          )}

          {/* Step 1: Enter email */}
          {otpStep === "idle" || otpStep === "sending" ? (
            <div>
              <p className="text-sm text-[#0a0a0a]/60 mb-3">
                {ALLOWED_DOMAIN
                  ? `Enter an @${ALLOWED_DOMAIN} email. A verification code will be sent to confirm.`
                  : "Enter the new admin's email. A verification code will be sent to confirm."}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => {
                    setNewAdminEmail(e.target.value);
                    setAdminError("");
                  }}
                  placeholder={ALLOWED_DOMAIN ? `name@${ALLOWED_DOMAIN}` : "name@example.com"}
                  disabled={otpStep === "sending"}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#0a0a0a]/10 text-sm bg-[#ffffff] placeholder:text-[#0a0a0a]/60 focus:outline-none focus:border-[#0a0a0a]/30 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={otpStep === "sending" || !newAdminEmail.trim() || !newAdminEmail.includes("@")}
                  className="px-5 py-2.5 bg-[#0a0a0a] text-[#facc15] rounded-xl text-sm font-semibold hover:bg-[#000000] transition-colors disabled:opacity-30 whitespace-nowrap"
                >
                  {otpStep === "sending" ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-[#facc15]/30 border-t-[#facc15] rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Code"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Enter OTP */
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-[#0a0a0a]/60">
                  Code sent to <span className="font-medium text-[#000000]">{newAdminEmail}</span>
                </p>
                <button
                  onClick={resetAddFlow}
                  className="text-[11px] text-[#0a0a0a]/50 hover:text-[#0a0a0a] transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-[#0a0a0a]/50 mb-5">
                Ask them to check their email and share the 6-digit code
              </p>

              {/* OTP boxes */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    disabled={otpStep === "verifying"}
                    className="w-12 h-14 text-center text-xl font-bold text-[#0a0a0a] bg-[#ffffff] border-2 border-[#0a0a0a]/10 rounded-xl focus:outline-none focus:border-[#0a0a0a]/40 transition-colors disabled:opacity-50"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpStep === "verifying" || otpCode.join("").length !== 6}
                className="w-full py-2.5 bg-[#0a0a0a] text-[#facc15] rounded-xl text-sm font-semibold hover:bg-[#000000] transition-colors disabled:opacity-30"
              >
                {otpStep === "verifying" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-[#facc15]/30 border-t-[#facc15] rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify & Add Admin"
                )}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={otpStep === "verifying"}
                className="w-full mt-2 py-2 text-[11px] text-[#0a0a0a]/50 hover:text-[#0a0a0a]/80 transition-colors"
              >
                Resend code
              </button>
            </div>
          )}

          {adminError && (
            <p className="text-xs text-red-600 mt-3">{adminError}</p>
          )}
        </div>
      </section>

      {/* ── Roles ── */}
      <section>
        <h2 className="text-xs font-semibold text-[#0a0a0a]/50 uppercase tracking-wider mb-4">
          Roles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#ffffff] rounded-2xl border border-[#0a0a0a]/8 p-5">
            <span className="inline-block text-[10px] px-2.5 py-1 rounded-lg font-bold bg-[#facc15] text-[#0a0a0a] mb-3">
              Admin
            </span>
            <ul className="space-y-2">
              {[
                "Create & delete events",
                "Upload guest lists",
                "Run MatchUp algorithm",
                "Send match emails",
                "Manage team access",
              ].map((item) => (
                <li key={item} className="text-xs text-[#0a0a0a]/50 flex items-center gap-2">
                  <svg className="w-3 h-3 text-[#0a0a0a]/45 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#ffffff] rounded-2xl border border-[#0a0a0a]/8 p-5">
            <span className="inline-block text-[10px] px-2.5 py-1 rounded-lg font-bold bg-[#0a0a0a]/6 text-[#0a0a0a]/55 mb-3">
              Viewer
            </span>
            <ul className="space-y-2">
              {[
                "View dashboard metrics",
                "Browse event details",
                "See participant lists",
                "View match results",
                "Read-only access",
              ].map((item) => (
                <li key={item} className="text-xs text-[#0a0a0a]/50 flex items-center gap-2">
                  <svg className="w-3 h-3 text-[#0a0a0a]/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-[#0a0a0a]/40 mt-3">
          {ALLOWED_DOMAIN
            ? `Any @${ALLOWED_DOMAIN} Google account can sign in as a viewer. Only admins can modify data.`
            : "Any signed-in Google account can view. Only admins can modify data."}
        </p>
      </section>
    </div>
  );
}
