"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadInstagramEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return scriptLoadingPromise;
}

// Uses Instagram's own official embed widget (the same one behind the
// "Embed" button on instagram.com) - no OAuth, no Meta app review, works for
// any public post. This is the MVP scope for req 16; live follower counts
// would need the full Graph API + a reviewed Meta app, saved for a later phase.
export function InstagramEmbedBlock({ postUrl }: { postUrl: string }) {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    loadInstagramEmbedScript().then(() => {
      window.instgrm?.Embeds.process();
    });
  }, [postUrl]);

  return (
    <blockquote
      ref={ref}
      className="instagram-media"
      data-instgrm-permalink={postUrl}
      data-instgrm-version="14"
      style={{ margin: "0 auto", maxWidth: 540, minWidth: 280 }}
    >
      <a href={postUrl} target="_blank" rel="noreferrer">
        مشاهده پست در اینستاگرام
      </a>
    </blockquote>
  );
}
