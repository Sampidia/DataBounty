'use client';

import React, { useEffect, useRef } from 'react';

// Official Cloudflare testing sitekey (always passes in dev mode if env variable is not set)
const DEFAULT_TEST_SITEKEY = '1x00000000000000000000AA';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: any) => void;
  resetSignal?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err?: any) => void;
          theme?: 'dark' | 'light' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileWidget({ onVerify, onExpire, onError, resetSignal }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_TEST_SITEKEY;

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
          'error-callback': (err?: any) => {
            if (isMounted && onError) onError(err);
          },
          theme: 'dark',
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn('[Turnstile Widget Render Warning]', err);
      }
    };

    // Load Turnstile script if not already present
    const existingScript = document.getElementById('cloudflare-turnstile-script');
    if (window.turnstile) {
      renderWidget();
    } else if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'cloudflare-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile) {
          renderWidget();
        }
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', renderWidget);
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, resetSignal]);

  return (
    <div className="flex flex-col items-center justify-center my-3 min-h-[65px]">
      <div ref={containerRef} className="cf-turnstile" />
    </div>
  );
}
