import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!window.googleIdentityScriptPromise) {
    window.googleIdentityScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
      const script = existingScript || document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => {
        delete window.googleIdentityScriptPromise;
        reject(new Error("Google sign-in could not load. Check your connection and try again."));
      };
      if (!existingScript) document.head.appendChild(script);
    });
  }

  return window.googleIdentityScriptPromise;
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const credentialHandlerRef = useRef(onCredential);
  const [loadError, setLoadError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    credentialHandlerRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let active = true;

    if (!clientId) return () => { active = false; };

    loadGoogleIdentityScript()
      .then(() => {
        if (!active || !buttonRef.current || !window.google?.accounts?.id) return;

        buttonRef.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) credentialHandlerRef.current(response.credential);
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(buttonRef.current.clientWidth || 360, 360),
          logo_alignment: "left",
        });
      })
      .catch((error) => {
        if (active) setLoadError(error.message || "Google sign-in could not load.");
      });

    return () => { active = false; };
  }, [clientId]);

  if (!clientId) {
    return <p className="google-signin-not-configured">Google sign-in will appear here after its OAuth client ID is configured.</p>;
  }

  return (
    <div className={`google-signin-wrap${disabled ? " is-disabled" : ""}`}>
      {loadError ? <p className="error-message">{loadError}</p> : <div ref={buttonRef} className="google-signin-button" />}
      {disabled && <span className="google-signin-busy" aria-live="polite">Signing in…</span>}
    </div>
  );
}
