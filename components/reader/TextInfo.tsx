'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EditTextModal } from '@/components/texts/EditTextModal';
import {
  ChevronLeft,
  BookOpen,
  Library,
  Download,
  Pencil
} from 'lucide-react';
import type { WordInstanceItem } from '@/lib/types/api';

// ============================================================================
// TextInfo Component
// Displays text metadata, progress, series info, tags, and actions in the
// reader's left sidebar
// ============================================================================

interface TextInfoProps {
  textId: string;
  title: string;
  wordCount: number;
  uniqueWordCount: number;
  viewCount: number;
  knownPercentage: number;
  seriesId: string;
  seriesName: string;
  tags: string[];
}

export function TextInfo({
  textId,
  title,
  wordCount,
  uniqueWordCount,
  viewCount,
  knownPercentage,
  seriesId,
  seriesName,
  tags,
}: TextInfoProps) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExportMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTxt = useCallback(async () => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const res = await fetch(`/api/texts/${textId}`);
      if (!res.ok) throw new Error('Failed to fetch text');
      const data = await res.json() as { text: { content: string } };
      const safeTitle = title.replace(/[^\w\s-]/g, '').trim();
      const header = [
        `Title: ${title}`,
        `Series: ${seriesName}`,
        `Known: ${Math.round(knownPercentage * 10) / 10}%`,
        `Words: ${wordCount.toLocaleString('en-US')} total, ${uniqueWordCount.toLocaleString('en-US')} unique`,
        tags.length > 0 ? `Tags: ${tags.join(', ')}` : null,
        '',
        '─'.repeat(60),
        '',
      ].filter(Boolean).join('\n');
      triggerDownload(header + data.text.content, `${safeTitle}.txt`, 'text/plain;charset=utf-8');
    } finally {
      setIsExporting(false);
    }
  }, [textId, title, seriesName, knownPercentage, wordCount, uniqueWordCount, tags]);

  const handleExportCsv = useCallback(async () => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const res = await fetch(`/api/texts/${textId}/word-instances`);
      if (!res.ok) throw new Error('Failed to fetch word instances');
      const data = await res.json() as { instances: WordInstanceItem[] };
      const seen = new Set<string>();
      const rows: WordInstanceItem[] = [];
      for (const inst of data.instances) {
        if (!seen.has(inst.wordId)) {
          seen.add(inst.wordId);
          rows.push(inst);
        }
      }
      const escapeCsv = (val: string | null | undefined) => {
        const s = val ?? '';
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      const header = 'Lemma,Translation,Status,Encounters,Frequency\n';
      const body = rows.map(r =>
        [escapeCsv(r.lemma), escapeCsv(r.translation), escapeCsv(r.status), r.userFrequency, r.dictionaryFrequency].join(',')
      ).join('\n');
      const safeTitle = title.replace(/[^\w\s-]/g, '').trim();
      triggerDownload('﻿' + header + body, `${safeTitle}-vocabulary.csv`, 'text/csv;charset=utf-8');
    } finally {
      setIsExporting(false);
    }
  }, [textId, title]);

  const handleEditText = () => {
    setIsEditOpen(true);
  };

  return (
    <div className="p-6 pt-24 xl:pt-6 pb-24 xl:pb-6 space-y-6 h-full overflow-y-auto">
      {/* Back Navigation */}
      <Link 
        href={`/series/${seriesId}`}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-ui-base font-medium"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span>Back to Series</span>
      </Link>

      {/* Text Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted">
          <BookOpen size={16} strokeWidth={1.5} />
          <span className="font-sans text-ui-sm uppercase tracking-wide">Reading</span>
        </div>
        <Heading size="lg" as="h1" className="font-serif">
          {title}
        </Heading>
      </div>

      {/* Series Info */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <Library size={14} strokeWidth={1.5} className="text-muted" />
          <Muted className="text-ui-xs">Series</Muted>
        </div>
        <Link 
          href={`/series/${seriesId}`}
          className="font-sans text-ui-base text-primary hover:text-primary/80 transition-colors font-medium"
        >
          {seriesName}
        </Link>
      </div>

      {/* Progress Section */}
      <div className="pt-4 border-t border-border space-y-3">
        <div>
          <Muted className="text-ui-xs mb-1">Reading Progress</Muted>
          <Heading size="sm" as="h3" className="text-primary">
            {Math.round(knownPercentage)}% Complete
          </Heading>
          <ProgressBar 
            value={knownPercentage} 
            className="mt-2"
          />
        </div>
      </div>

      {/* Statistics Section */}
      <div className="pt-4 border-t border-border space-y-2">
        <Muted className="text-ui-xs mb-2">Text Statistics</Muted>
        <div className="flex justify-between items-center">
          <span className="font-sans text-ui-sm text-muted">Total Words</span>
          <span className="font-sans text-ui-base text-ink font-medium">
            {wordCount.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-ui-sm text-muted">Unique Words</span>
          <span className="font-sans text-ui-base text-ink font-medium">
            {uniqueWordCount.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-ui-sm text-muted">Times Read</span>
          {viewCount === 0 ? (
            <span className="flex items-center gap-1.5 font-sans text-ui-sm text-primary font-medium">
              <img src="/illustrations/lantern.svg" width={18} height={18} alt="" />
              First read
            </span>
          ) : (
            <span className="font-sans text-ui-base text-ink font-medium">{viewCount}</span>
          )}
        </div>
      </div>

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="pt-4 border-t border-border">
          <Muted className="text-ui-xs mb-2">Tags</Muted>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-desk border border-border rounded-full font-sans text-ui-xs text-ink"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border flex gap-2">
        <div ref={exportMenuRef} className="relative flex-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={16} strokeWidth={1.5} />}
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
          {showExportMenu && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-paper border border-border rounded-card shadow-modal min-w-35 py-1">
              <button
                type="button"
                onClick={handleExportTxt}
                className="w-full text-left px-3 py-2 font-sans text-ui-sm text-ink hover:bg-desk transition-colors"
              >
                Export as TXT
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full text-left px-3 py-2 font-sans text-ui-sm text-ink hover:bg-desk transition-colors"
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pencil size={16} strokeWidth={1.5} />}
          onClick={handleEditText}
          className="flex-1"
        >
          Edit Text
        </Button>
      </div>

      <EditTextModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        textId={textId}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['text', textId] });
          queryClient.invalidateQueries({ queryKey: ['word-instances', textId] });
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}
