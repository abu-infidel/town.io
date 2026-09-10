"use client";

import { useState } from "react";
import type { BlockType } from "@mahalle/shared";
import { BLOCK_TYPES } from "@mahalle/shared";
import { clientFetch } from "@/lib/client-api";
import { BlockList } from "@/components/editor/BlockList";
import type { OwnedBusinessDto } from "@/lib/types";
import { BusinessInfoForm } from "./BusinessInfoForm";
import { ProductManager } from "./ProductManager";

const STATUS_LABELS_FA: Record<string, string> = {
  pending: "در صف بررسی خودکار",
  auto_approved: "منتشر شده و قابل مشاهده",
  approved: "منتشر شده و قابل مشاهده",
  needs_human_review: "در انتظار تایید مدیر — هنوز عمومی نیست",
  auto_rejected: "رد شده",
  rejected: "رد شده",
};

type Tab = "info" | "pages" | "products";

export function BusinessEditor({ initialBusiness }: { initialBusiness: OwnedBusinessDto }) {
  const [business, setBusiness] = useState(initialBusiness);
  const [tab, setTab] = useState<Tab>("info");
  const [activePageId, setActivePageId] = useState(initialBusiness.pages[0]?.id);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [addingPage, setAddingPage] = useState(false);

  const activePage = business.pages.find((p) => p.id === activePageId) ?? business.pages[0];

  async function addPage() {
    if (!newPageTitle.trim()) return;
    const res = await clientFetch(`/business/${business.id}/pages`, { method: "POST", body: JSON.stringify({ title: newPageTitle.trim() }) });
    const page = await res.json();
    setBusiness((b) => ({ ...b, pages: [...b.pages, { ...page, blocks: [] }] }));
    setActivePageId(page.id);
    setNewPageTitle("");
    setAddingPage(false);
  }

  async function deletePage(pageId: string) {
    if (!confirm("این صفحه حذف شود؟")) return;
    const res = await clientFetch(`/business/pages/${pageId}`, { method: "DELETE" });
    if (!res.ok) return;
    setBusiness((b) => {
      const pages = b.pages.filter((p) => p.id !== pageId);
      if (activePageId === pageId) setActivePageId(pages[0]?.id);
      return { ...b, pages };
    });
  }

  async function addBlock(pageId: string, type: BlockType, content: Record<string, any>) {
    const res = await clientFetch(`/business/pages/${pageId}/blocks`, { method: "POST", body: JSON.stringify({ type, content }) });
    const block = await res.json();
    setBusiness((b) => ({ ...b, pages: b.pages.map((p) => (p.id === pageId ? { ...p, blocks: [...p.blocks, block] } : p)) }));
  }

  async function updateBlock(pageId: string, blockId: string, content: Record<string, any>) {
    const page = business.pages.find((p) => p.id === pageId)!;
    const type = page.blocks.find((bl) => bl.id === blockId)!.type;
    const res = await clientFetch(`/business/blocks/${blockId}`, { method: "PATCH", body: JSON.stringify({ type, content }) });
    const updated = await res.json();
    setBusiness((b) => ({
      ...b,
      pages: b.pages.map((p) => (p.id === pageId ? { ...p, blocks: p.blocks.map((bl) => (bl.id === blockId ? updated : bl)) } : p)),
    }));
  }

  async function deleteBlock(pageId: string, blockId: string) {
    await clientFetch(`/business/blocks/${blockId}`, { method: "DELETE" });
    setBusiness((b) => ({ ...b, pages: b.pages.map((p) => (p.id === pageId ? { ...p, blocks: p.blocks.filter((bl) => bl.id !== blockId) } : p)) }));
  }

  async function reorderBlocks(pageId: string, orderedBlockIds: string[]) {
    setBusiness((b) => ({
      ...b,
      pages: b.pages.map((p) => (p.id === pageId ? { ...p, blocks: orderedBlockIds.map((id) => p.blocks.find((bl) => bl.id === id)!) } : p)),
    }));
    await clientFetch(`/business/pages/${pageId}/blocks/reorder`, { method: "POST", body: JSON.stringify({ orderedBlockIds }) });
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>{business.name}</h1>
        <span className="muted">{STATUS_LABELS_FA[business.moderationStatus] ?? business.moderationStatus}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
        <button className={tab === "info" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setTab("info")}>
          اطلاعات پایه
        </button>
        <button className={tab === "pages" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setTab("pages")}>
          صفحات
        </button>
        <button className={tab === "products" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setTab("products")}>
          محصولات و خدمات
        </button>
      </div>

      {tab === "info" && <BusinessInfoForm business={business} onSaved={setBusiness} />}

      {tab === "pages" && (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {business.pages.map((page) => (
              <div key={page.id} style={{ display: "flex", alignItems: "center" }}>
                <button className={page.id === activePageId ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setActivePageId(page.id)}>
                  {page.title}
                </button>
                {page.id === activePageId && (
                  <button className="btn btn-secondary" style={{ color: "var(--color-danger)", marginInlineStart: 4 }} onClick={() => deletePage(page.id)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            {addingPage ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input" placeholder="عنوان صفحه جدید" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} style={{ width: 160 }} />
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

          {activePage && (
            <BlockList
              blocks={activePage.blocks}
              availableTypes={[...BLOCK_TYPES]}
              onAdd={(type, content) => addBlock(activePage.id, type, content)}
              onUpdate={(blockId, content) => updateBlock(activePage.id, blockId, content)}
              onDelete={(blockId) => deleteBlock(activePage.id, blockId)}
              onReorder={(ids) => reorderBlocks(activePage.id, ids)}
            />
          )}
        </div>
      )}

      {tab === "products" && <ProductManager businessId={business.id} initialProducts={business.products} />}
    </div>
  );
}
