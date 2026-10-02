import React, { useEffect, useRef, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-google-identity="true"]',
    );
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Google Sign-In."));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({
  remember = true,
  onSuccess,
  onError,
}) {
  const buttonRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  successRef.current = onSuccess;
  errorRef.current = onError;
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    let active = true;
    if (!clientId) {
      setStatus("missing-config");
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current || !window.google?.accounts?.id)
          return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential)
              return errorRef.current?.(
                "Google did not return an identity token.",
              );
            setStatus("busy");
            try {
              const response = await fetch(`${API_BASE}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok)
                throw new Error(data.message || "Google sign-in failed.");
              const store = remember ? localStorage : sessionStorage;
              store.setItem("token", data.token);
              store.setItem("user", JSON.stringify(data.user));
              successRef.current?.(data);
            } catch (error) {
              setStatus("ready");
              errorRef.current?.(error.message || "Google sign-in failed.");
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(420, buttonRef.current.clientWidth || 420),
        });
        setStatus("ready");
      })
      .catch((error) => {
        if (active) {
          setStatus("error");
          errorRef.current?.(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [clientId, remember]);

  if (status === "missing-config") {
    return (
      <button
        type="button"
        onClick={() =>
          onError?.(
            "Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to the frontend environment.",
          )
        }
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
      >
        <span className="text-base font-bold">G</span>
        Continue with Google
      </button>
    );
  }

  return (
    <div className="min-h-[44px] w-full" aria-busy={status === "busy"}>
      <div
        ref={buttonRef}
        className="flex min-h-[44px] w-full justify-center"
      />
    </div>
  );
}
