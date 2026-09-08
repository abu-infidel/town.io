import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, serverFetch } from "@/lib/server-api";
import type { PublicProfileDto } from "@/lib/types";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { ProfileActions } from "@/components/profile/ProfileActions";

async function loadProfile(handle: string): Promise<PublicProfileDto | null> {
  try {
    const res = await serverFetch(`/profile/handle/${handle}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const profile = await loadProfile(params.handle);
  if (!profile) return {};
  return {
    title: `${profile.displayName} | محله`,
    description: `صفحه ${profile.displayName} در محله`,
  };
}

export default async function PublicProfilePage({ params }: { params: { handle: string } }) {
  const [profile, viewer] = await Promise.all([loadProfile(params.handle), getCurrentUser()]);
  if (!profile) notFound();

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56 }}>
      <div className="card" style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>{profile.displayName}</h1>
        {profile.neighborhood && <div className="muted">📍 {profile.neighborhood}</div>}
        {profile.instagramHandle && (
          <a
            href={`https://instagram.com/${profile.instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ marginTop: 12 }}
          >
            📷 {profile.instagramHandle}@ در اینستاگرام
          </a>
        )}
        {viewer?.id !== profile.userId && (
          <div style={{ marginTop: 12 }}>
            <ProfileActions targetUserId={profile.userId} loggedIn={!!viewer} />
          </div>
        )}
      </div>

      {profile.pages.map((page) => (
        <section key={page.id} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, color: "var(--color-text-muted)", marginBottom: 12 }}>{page.title}</h2>

          {page.kind === "career" && profile.careerEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
              {profile.careerEntries.map((entry) => (
                <div key={entry.id} style={{ borderInlineStart: "2px solid var(--color-border)", paddingInlineStart: 16 }}>
                  <div style={{ fontWeight: 700 }}>
                    {entry.title} · {entry.organization}
                  </div>
                  <div className="muted">
                    {new Date(entry.startDate).toLocaleDateString("fa-IR")} —{" "}
                    {entry.current ? "اکنون" : entry.endDate ? new Date(entry.endDate).toLocaleDateString("fa-IR") : ""}
                  </div>
                  {entry.description && <div>{entry.description}</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {page.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
            {page.blocks.length === 0 && page.kind !== "career" && (
              <div className="muted">هنوز محتوایی اضافه نشده است.</div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
