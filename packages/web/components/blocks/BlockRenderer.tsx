import type { ProfileBlockDto } from "@/lib/types";
import { ResolvedImage, ResolvedVideo } from "./MediaResolvers";
import { InstagramEmbedBlock } from "./InstagramEmbedBlock";

export function BlockRenderer({ block, ownerPreview = false }: { block: ProfileBlockDto; ownerPreview?: boolean }) {
  const c = block.content as Record<string, any>;

  switch (block.type) {
    case "heading":
      return <h3 style={{ fontSize: 20, margin: "8px 0" }}>{c.text}</h3>;

    case "text":
      return <p style={{ whiteSpace: "pre-wrap" }}>{c.text}</p>;

    case "image":
      return (
        <figure style={{ margin: 0 }}>
          <ResolvedImage mediaId={c.mediaId} ownerPreview={ownerPreview} />
          {c.caption && <figcaption className="muted">{c.caption}</figcaption>}
        </figure>
      );

    case "gallery":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {(c.mediaIds as string[]).map((id) => (
            <ResolvedImage key={id} mediaId={id} ownerPreview={ownerPreview} />
          ))}
        </div>
      );

    case "video":
      return (
        <figure style={{ margin: 0 }}>
          <ResolvedVideo mediaId={c.mediaId} ownerPreview={ownerPreview} />
          {c.caption && <figcaption className="muted">{c.caption}</figcaption>}
        </figure>
      );

    case "quote":
      return (
        <blockquote
          style={{
            borderInlineStart: "4px solid var(--color-brand)",
            margin: 0,
            padding: "4px 16px",
            fontStyle: "italic",
          }}
        >
          «{c.text}»
          {c.attribution && <div className="muted">— {c.attribution}</div>}
        </blockquote>
      );

    case "link":
      return (
        <a href={c.url} target="_blank" rel="noreferrer" className="btn btn-secondary">
          🔗 {c.label}
        </a>
      );

    case "achievement":
      return (
        <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 28 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 700 }}>{c.title}</div>
            {c.date && <div className="muted">{c.date}</div>}
            {c.description && <div>{c.description}</div>}
          </div>
        </div>
      );

    case "timelineItem":
      return (
        <div style={{ borderInlineStart: "2px solid var(--color-border)", paddingInlineStart: 16 }}>
          <div style={{ fontWeight: 700 }}>{c.title}</div>
          {c.organization && <div className="muted">{c.organization}</div>}
          <div className="muted">
            {c.startDate} — {c.current ? "اکنون" : c.endDate ?? ""}
          </div>
          {c.description && <div>{c.description}</div>}
        </div>
      );

    case "instagramEmbed":
      return <InstagramEmbedBlock postUrl={c.postUrl} />;

    case "divider":
      return <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />;

    default:
      return null;
  }
}
