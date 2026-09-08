"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlockType, ProfileTemplate } from "@mahalle/shared";
import { BLOCK_TYPES } from "@mahalle/shared";
import type { FullProfileDto } from "@/lib/types";
import { clientFetch } from "@/lib/client-api";
import { ThemeEditor } from "./ThemeEditor";
import { BlockList } from "./BlockList";
import { CareerEntries } from "./CareerEntries";

export function ProfileEditor({ initialProfile }: { initialProfile: FullProfileDto }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [activePageId, setActivePageId] = useState(initialProfile.pages[0]?.id);
  const [showTheme, setShowTheme] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [addingPage, setAddingPage] = useState(false);

  const activePage = profile.pages.find((p) => p.id === activePageId) ?? profile.pages[0];

  async function refreshFromServer() {
    const res = await clientFetch("/profile/me");
    if (res.ok) setProfile(await res.json());
  }

  async function saveTheme(data: {
    template: ProfileTemplate;
    accentColor: string;
    instagramHandle?: string;
    avatarMediaId?: string;
    coverMediaId?: string;
  }) {
    await clientFetch("/profile/me/theme", { method: "PATCH", body: JSON.stringify(data) });
    await refreshFromServer();
    router.refresh();
  }

  async function addPage() {
    if (!newPageTitle.trim()) return;
    const res = await clientFetch("/profile/me/pages", {
      method: "POST",
      body: JSON.stringify({ kind: "custom", title: newPageTitle.trim() }),
    });
    const page = await res.json();
    setProfile((p) => ({ ...p, pages: [...p.pages, { ...page, blocks: [] }] }));
    setActivePageId(page.id);
    setNewPageTitle("");
    setAddingPage(false);
  }

  async function deletePage(pageId: string) {
    if (!confirm("این صفحه حذف شود؟")) return;
    const res = await clientFetch(`/profile/me/pages/${pageId}`, { method: "DELETE" });
    if (!res.ok) return;
    setProfile((p) => {
      const pages = p.pages.filter((pg) => pg.id !== pageId);
      if (activePageId === pageId) setActivePageId(pages[0]?.id);
      return { ...p, pages };
    });
  }

  async function addBlock(pageId: string, type: BlockType, content: Record<string, any>) {
    const res = await clientFetch(`/profile/me/pages/${pageId}/blocks`, {
      method: "POST",
      body: JSON.stringify({ type, content }),
    });
    const block = await res.json();
    setProfile((p) => ({
      ...p,
      pages: p.pages.map((pg) => (pg.id === pageId ? { ...pg, blocks: [...pg.blocks, block] } : pg)),
    }));
  }

  async function updateBlock(pageId: string, blockId: string, content: Record<string, any>) {
    const page = profile.pages.find((pg) => pg.id === pageId)!;
    const type = page.blocks.find((b) => b.id === blockId)!.type;
    const res = await clientFetch(`/profile/me/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify({ type, content }),
    });
    const updated = await res.json();
    setProfile((p) => ({
      ...p,
      pages: p.pages.map((pg) =>
        pg.id === pageId ? { ...pg, blocks: pg.blocks.map((b) => (b.id === blockId ? updated : b)) } : pg
      ),
    }));
  }

  async function deleteBlock(pageId: string, blockId: string) {
    await clientFetch(`/profile/me/blocks/${blockId}`, { method: "DELETE" });
    setProfile((p) => ({
      ...p,
      pages: p.pages.map((pg) => (pg.id === pageId ? { ...pg, blocks: pg.blocks.filter((b) => b.id !== blockId) } : pg)),
    }));
  }

  async function reorderBlocks(pageId: string, orderedBlockIds: string[]) {
    setProfile((p) => ({
      ...p,
      pages: p.pages.map((pg) =>
        pg.id === pageId
          ? { ...pg, blocks: orderedBlockIds.map((id) => pg.blocks.find((b) => b.id === id)!) }
          : pg
      ),
    }));
    await clientFetch("/profile/me/blocks/reorder", { method: "POST", body: JSON.stringify({ pageId, orderedBlockIds }) });
  }

  async function addCareerEntry(entry: {
    organization: string;
    title: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }) {
    const res = await clientFetch("/profile/me/career", { method: "POST", body: JSON.stringify(entry) });
    const created = await res.json();
    setProfile((p) => ({ ...p, careerEntries: [created, ...p.careerEntries] }));
  }

  async function deleteCareerEntry(entryId: string) {
    await clientFetch(`/profile/me/career/${entryId}`, { method: "DELETE" });
    setProfile((p) => ({ ...p, careerEntries: p.careerEntries.filter((e) => e.id !== entryId) }));
  }

  if (!activePage) return null;

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => setShowTheme((s) => !s)}>
        🎨 {showTheme ? "بستن شخصی‌سازی ظاهر" : "شخصی‌سازی ظاهر صفحه"}
      </button>

      {showTheme && (
        <ThemeEditor
          template={profile.template}
          accentColor={profile.accentColor}
          instagramHandle={profile.instagramHandle}
          avatarMediaId={profile.avatarMediaId}
          coverMediaId={profile.coverMediaId}
          onSave={saveTheme}
        />
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
        {profile.pages.map((page) => (
          <div key={page.id} style={{ display: "flex", alignItems: "center" }}>
            <button
              className={page.id === activePageId ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setActivePageId(page.id)}
            >
              {page.title}
            </button>
            {page.kind === "custom" && page.id === activePageId && (
              <button className="btn btn-secondary" style={{ color: "var(--color-danger)", marginInlineStart: 4 }} onClick={() => deletePage(page.id)}>
                ✕
              </button>
            )}
          </div>
        ))}

        {addingPage ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="input"
              placeholder="عنوان صفحه جدید"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              style={{ width: 160 }}
            />
            <button className="btn btn-primary" onClick={addPage}>
              افزودن
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setAddingPage(true)}>
            + صفحه جدید
          </button>
        )}
      </div>

      {activePage.kind === "career" && (
        <CareerEntries entries={profile.careerEntries} onAdd={addCareerEntry} onDelete={deleteCareerEntry} />
      )}

      <BlockList
        blocks={activePage.blocks}
        availableTypes={[...BLOCK_TYPES]}
        onAdd={(type, content) => addBlock(activePage.id, type, content)}
        onUpdate={(blockId, content) => updateBlock(activePage.id, blockId, content)}
        onDelete={(blockId) => deleteBlock(activePage.id, blockId)}
        onReorder={(ids) => reorderBlocks(activePage.id, ids)}
      />
    </div>
  );
}
