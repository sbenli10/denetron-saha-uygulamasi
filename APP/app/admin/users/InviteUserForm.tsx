//APP\app\admin\users\InviteUserForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2, UserPlus, ArrowRight, ArrowLeft, Mail } from "lucide-react";

/* -----------------------------------------
   UTILS — EMAIL AUTOCOMPLETE OPTIONS
----------------------------------------- */
const emailDomains = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "firma.com", // org domain
];

/* -----------------------------------------
   AVATAR COMPONENT (macOS Style)
----------------------------------------- */
function UserAvatar({ email }: { email: string }) {
  const letter =
    email?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      className="
        w-12 h-12 rounded-full 
        bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
        shadow-[0_4px_14px_rgba(99,102,241,0.3)]
        flex items-center justify-center
        text-white font-semibold text-lg
      "
    >
      {letter}
    </div>
  );
}

/* -----------------------------------------
   MAIN COMPONENT
----------------------------------------- */
export default function InviteUserForm({
  orgId,
  roles,
}: {
  orgId: string;
  roles: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  // Multi-Step
  const [step, setStep] = useState<1 | 2>(1);

  // Fields
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles?.[0]?.id || "");

  // Error + Loading
  const [error, setError] = useState("");
  const [loading, startTransition] = useTransition();

  // Email autocomplete
  const [showAuto, setShowAuto] = useState(false);

  /* -----------------------------------------
     SEND INVITE
  ----------------------------------------- */
  function sendInvite() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/invites/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, orgId, role_id: roleId }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          setError(error ?? "Davet gönderilemedi.");
          return;
        }

        alert("Davet gönderildi!");
        setOpen(false);
        setEmail("");
        setError("");
        setStep(1);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => {
          setOpen(true);
          setStep(1);
        }}
        className="
          px-4 py-2 rounded-xl bg-[#6366F1] text-white
          hover:bg-[#575ce6] transition-all flex items-center gap-2
          shadow-[0_4px_14px_rgba(99,102,241,0.35)]
        "
      >
        <UserPlus size={16} />
        Yeni Üye Daveti
      </button>

      {/* MODAL */}
      {open && (
        <>
          {/* OVERLAY */}
          <div
            onClick={() => !loading && setOpen(false)}
            className="
              fixed inset-0 bg-black/40 backdrop-blur-sm 
              z-[9998] animate-[fadeIn_0.25s_ease]
            "
          />

          {/* CENTERED PANEL */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4">
            <div
              className="
                w-full max-w-xl
                rounded-[32px]
                bg-white/60 backdrop-blur-2xl
                border border-white/70
                shadow-[0_12px_45px_rgba(0,0,0,0.22)]
                p-8
                animate-[spotlightOpen_0.35s_ease]
              "
            >
              {/* ----------------------------- */}
              {/* STEP 1 — EMAIL ENTRY + AVATAR */}
              {/* ----------------------------- */}
              {step === 1 && (
                <div className="space-y-8">

                  <h2 className="text-2xl font-semibold text-black">
                    Yeni Üye Daveti
                  </h2>

                  <p className="text-sm text-black/60">
                    Davet ettiğiniz kişiye e-posta gönderilir.  
                    Kişi daveti kabul ettiğinde organizasyonunuza otomatik olarak eklenir.
                  </p>
                  {/* Avatar Preview */}
                  <div className="flex items-center gap-4">
                    <UserAvatar email={email} />

                    <div className="flex-1 relative">
                      <label className="block text-sm text-black/70 mb-1">
                        E-posta Adresi
                      </label>

                      <input
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setShowAuto(true);
                        }}
                        placeholder="ornek@firma.com"
                        className="
                          w-full px-4 py-3 rounded-xl
                          bg-white/70 text-black
                          border border-black/10
                          focus:ring-2 focus:ring-[#6366F1]
                          backdrop-blur-md transition-all
                          placeholder:text-black/40
                        "
                      />

                      <p className="text-xs text-black/50 mt-1">
                        Bu e-posta adresine bir davet bağlantısı gönderilecektir.
                      </p>
                      {/* AUTOCOMPLETE DROPDOWN */}
                      {showAuto && email.includes("@") === false && (
                        <div className="
                          absolute left-0 right-0 mt-1
                          bg-white/90 backdrop-blur-xl
                          border border-black/10 rounded-xl
                          shadow-[0_4px_20px_rgba(0,0,0,0.15)]
                          overflow-hidden
                          animate-[fadeIn_0.2s_ease]
                        ">
                          {emailDomains.map((domain) => (
                            <button
                              key={domain}
                              onClick={() => {
                                setEmail(`${email}@${domain}`);
                                setShowAuto(false);
                              }}
                              className="
                                w-full text-left px-4 py-2 text-sm
                                hover:bg-black/5 transition
                              "
                            >
                              {email}@{domain}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NEXT BUTTON */}
                  <div className="flex justify-end">

                    {/* CANCEL BUTTON (YENİ EKLENDİ) */}
                    <button
                      onClick={() => setOpen(false)}
                      disabled={loading}
                      className="
                        px-4 py-2 rounded-xl 
                        bg-black/10 text-black
                        hover:bg-black/20 transition-all
                      "
                    >
                      İptal Et
                    </button>

                    <button
                      disabled={!email.includes("@")}
                      onClick={() => setStep(2)}
                      className="
                        px-5 py-2 rounded-xl bg-[#6366F1] text-white
                        hover:bg-[#575ce6] flex items-center gap-2
                        disabled:opacity-40
                      "
                    >
                      Devam Et
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------------------- */}
              {/* STEP 2 — ROLE SELECTION */}
              {/* ----------------------------- */}
              {step === 2 && (
                <div className="space-y-8">

                  <h2 className="text-2xl font-semibold text-black">
                    Rol Seçimi
                  </h2>

                  <p className="text-sm text-black/60">
                    Seçilen rol, kullanıcının sistemde yapabileceklerini belirler.
                    Daha sonra değiştirilebilir.
                  </p>
                  {/* ROLLER */}
                  <div className="space-y-3">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRoleId(r.id)}
                        className={`
                          w-full text-left px-4 py-3 rounded-xl border
                          transition-all
                          ${
                            roleId === r.id
                              ? "bg-[#6366F1] text-white border-transparent shadow-md"
                              : "bg-white/70 text-black border-black/10 hover:bg-black/5"
                          }
                        `}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="
                        px-4 py-2 rounded-xl bg-black/10 text-black
                        hover:bg-black/20 flex items-center gap-2
                      "
                    >
                      <ArrowLeft size={16} />
                      Geri
                    </button>

                    <button
                      disabled={loading}
                      onClick={sendInvite}
                      className="
                        px-6 py-2 rounded-xl bg-[#6366F1] text-white
                        hover:bg-[#575ce6] flex items-center gap-2
                        disabled:opacity-50
                      "
                    >
                      {loading && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      Gönder
                    </button>

                    <p className="text-xs text-black/50 text-right">
                      Davetler 24 saat geçerlidir.  
                      İsterseniz daha sonra iptal edebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
              {/* ERROR */}
             {error && (
                <div className="text-red-600 text-sm mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SPOTLIGHT ANIMATION KEYFRAMES */}
      <style jsx global>{`
        @keyframes spotlightOpen {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
