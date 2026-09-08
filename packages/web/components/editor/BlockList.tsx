"use client";

import { useState } from "react";
import type { BlockType } from "@mahalle/shared";
import type { ProfileBlockDto } from "@/lib/types";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { BlockForm } from "./BlockForm";

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: "🔤 تیتر",
  text: "📝 متن",
  image: "🖼️ تصویر",
  gallery: "🖼️🖼️ گالری",
  video: "🎬 ویدیو",
  quote: "❝ نقل‌قول",
  link: "🔗 لینک",
  achievement: "🏆 دستاورد",
  timelineItem: "📌 سابقه شغلی",
  instagramEmbed: "📷 پست اینستاگرام",
  divider: "➖ خط جداکننده",
};

interface Props {
  blocks: ProfileBlockDto[];
  availableTypes: BlockType[];
  onAdd: (type: BlockType, content: Record<string, any>) => Promise<void>;
  onUpdate: (blockId: string, content: Record<string, any>) => Promise<void>;
  onDelete: (blockId: string) => Promise<void>;
  onReorder: (orderedBlockIds: string[]) => Promise<void>;
}

export function BlockList({ blocks, availableTypes, onAdd, onUpdate, onDelete, onReorder }: Props) {
  const [addingType, setAddingType] = useState<BlockType | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onReorder(reordered.map((b) => b.id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {blocks.map((block, index) =>
        editingBlockId === block.id ? (
          <BlockForm
            key={block.id}
            type={block.type}
            initialContent={block.content}
            onSubmit={async (content) => {
              await onUpdate(block.id, content);
              setEditingBlockId(null);
            }}
            onCancel={() => setEditingBlockId(null)}
          />
        ) : (
          <div key={block.id} className="card" style={{ position: "relative" }}>
            <BlockRenderer block={block} ownerPreview />
            <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => move(index, -1)} disabled={index === 0} title="بالا">
                ⬆️
              </button>
              <button className="btn btn-secondary" onClick={() => move(index, 1)} disabled={index === blocks.length - 1} title="پایین">
                ⬇️
              </button>
              <button className="btn btn-secondary" onClick={() => setEditingBlockId(block.id)}>
                ویرایش
              </button>
              <button className="btn btn-secondary" style={{ color: "var(--color-danger)" }} onClick={() => onDelete(block.id)}>
                حذف
              </button>
            </div>
          </div>
        )
      )}

      {addingType ? (
        <BlockForm
          type={addingType}
          onSubmit={async (content) => {
            await onAdd(addingType, content);
            setAddingType(null);
          }}
          onCancel={() => setAddingType(null)}
        />
      ) : (
        <div>
          <div className="muted" style={{ marginBottom: 8 }}>
            افزودن بخش جدید:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availableTypes.map((type) => (
              <button key={type} className="btn btn-secondary" onClick={() => setAddingType(type)}>
                {BLOCK_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
