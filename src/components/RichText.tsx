import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function parseTimestampToSeconds(s: string): number | null {
  const m = s.match(/^(?:(\d+):)?([0-5]?\d):([0-5]\d)$/);
  if (!m) return null;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  if (h > 99 || min > 59 || sec > 59) return null;
  return h * 3600 + min * 60 + sec;
}

const TOKEN_RE = /^(?:(\d+:)?[0-5]?\d:[0-5]\d)$/;
const HASHTAG_RE = /^#[\p{L}\p{N}_]{2,}$/u;
const MENTION_RE = /^@[\p{L}\p{N}_.]{2,}$/u;
const URL_RE = /^https?:\/\/\S+$/i;

interface RichTextProps {
  text: string;
  onSeek?: (seconds: number) => void;
  /** сворачивать длинные тексты после N символов */
  maxChars?: number;
  language?: string;
  linkClassName?: string;
}

/** Текст с кликабельными таймкодами, хэштегами, упоминаниями и ссылками. */
export function RichText({ text, onSeek, maxChars, language, linkClassName }: RichTextProps) {
  const [expanded, setExpanded] = useState(false);
  const ru = language === 'ru';
  const shown = !expanded && maxChars && text.length > maxChars ? text.slice(0, maxChars) : text;
  const cut = !expanded && maxChars != null && text.length > maxChars;
  const linkCls = linkClassName || 'text-[#70d6ff] hover:underline';

  const parts = shown.split(/(\s+)/);
  return (
    <span>
      {parts.map((tok, i) => {
        if (/^\s+$/.test(tok) || tok === '') return <span key={i}>{tok}</span>;
        const ts = TOKEN_RE.test(tok) ? parseTimestampToSeconds(tok) : null;
        if (ts != null && onSeek) {
          return (
            <button key={i} onClick={(e) => { e.stopPropagation(); onSeek(ts); }} className={`${linkCls} font-medium cursor-pointer bg-transparent border-0 p-0 text-left`}>
              {tok}
            </button>
          );
        }
        if (HASHTAG_RE.test(tok)) {
          return (
            <Link key={i} to={`/search?q=${encodeURIComponent(tok)}`} onClick={e => e.stopPropagation()} className={`${linkCls} font-medium`}>
              {tok}
            </Link>
          );
        }
        if (MENTION_RE.test(tok)) {
          return (
            <Link key={i} to={`/search?q=${encodeURIComponent(tok.slice(1))}`} onClick={e => e.stopPropagation()} className={`${linkCls} font-medium`}>
              {tok}
            </Link>
          );
        }
        if (URL_RE.test(tok)) {
          const clean = tok.replace(/[),.;!?]+$/, '');
          const tail = tok.slice(clean.length);
          return (
            <span key={i}>
              <a href={clean} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={linkCls}>{clean}</a>
              {tail}
            </span>
          );
        }
        return <span key={i}>{tok}</span>;
      })}
      {cut && (
        <>
          {'… '}
          <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }} className="text-slate-400 font-bold hover:text-white">
            {ru ? 'Читать далее' : 'Read more'}
          </button>
        </>
      )}
      {expanded && maxChars != null && (
        <>
          {' '}
          <button onClick={(e) => { e.stopPropagation(); setExpanded(false); }} className="text-slate-400 font-bold hover:text-white">
            {ru ? 'Свернуть' : 'Show less'}
          </button>
        </>
      )}
    </span>
  );
}

/** Достать @упоминания из текста (без @, уникальные, lowercase). */
export function extractMentions(text: string): string[] {
  const out = new Set<string>();
  const re = /@([\p{L}\p{N}_.]{2,})/gu;
  let m;
  while ((m = re.exec(text)) !== null) out.add(m[1].toLowerCase());
  return [...out].slice(0, 5);
}
