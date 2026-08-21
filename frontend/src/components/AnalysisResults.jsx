import { useState, useCallback } from 'react'

const SCORE_META = [
  { n: '01', key: 'length', label: 'CONTENT LENGTH' },
  { n: '02', key: 'hashtags', label: 'HASHTAGS' },
  { n: '03', key: 'questions', label: 'QUESTIONS' },
  { n: '04', key: 'cta', label: 'CALL TO ACTION' },
  { n: '05', key: 'hook', label: 'HOOK / OPENER' },
  { n: '06', key: 'readability', label: 'READABILITY' },
  { n: '07', key: 'formatting', label: 'FORMATTING' },
  { n: '08', key: 'energy', label: 'ENERGY' },
  { n: '09', key: 'variety', label: 'SENTENCE VARIETY' },
]

function scoreMeta(score) {
  if (score >= 80) return { label: 'STRONG', desc: 'Your content has strong engagement elements.', ring: '#6B7CFF' }
  if (score >= 60) return { label: 'GOOD', desc: 'Good foundation — a few adjustments could boost engagement.', ring: '#8B9CFF' }
  if (score >= 40) return { label: 'NEEDS IMPROVEMENT', desc: 'Several engagement elements are missing.', ring: '#C9A86A' }
  return { label: 'WEAK', desc: 'Key elements are missing. See the breakdown below.', ring: '#E85D4A' }
}

function suitabilityDisplay(label) {
  switch (label) {
    case 'likely_social_media': return 'LIKELY SOCIAL MEDIA CONTENT'
    case 'possibly_social_media': return 'POSSIBLY SOCIAL MEDIA CONTENT'
    case 'likely_document': return 'LIKELY DOCUMENT'
    default: return 'UNABLE TO ASSESS'
  }
}

function statusDisplay(status) {
  const s = (status || 'missing').toLowerCase()
  if (s === 'good') return 'GOOD'
  if (s === 'ok') return 'OK'
  if (s === 'needs_improvement') return 'NEEDS IMPROVEMENT'
  return 'MISSING'
}

function ScoreRing({ score }) {
  const m = scoreMeta(score)
  const size = 148
  const stroke = 2
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={m.ring} strokeWidth={stroke} strokeLinecap="butt"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1100ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-[300] tracking-[-0.04em] leading-none text-[#F2EFE8]">{score}</span>
        <span className="mono text-[10px] tracking-[0.16em] text-white/30 mt-1">/ 100</span>
      </div>
    </div>
  )
}

function BreakdownRow({ meta, explanation, isOpen, onToggle }) {
  const pct = explanation ? Math.round((explanation.earned / explanation.max) * 100) : 0
  const status = statusDisplay(explanation?.status)
  return (
    <div className="border-b border-white/[0.07] last:border-b-0">
      <button type="button" onClick={onToggle} className="w-full text-left py-5 sm:py-6 flex gap-4 sm:gap-6 group">
        <span className="mono text-[11px] tracking-[0.12em] text-white/25 mt-1 shrink-0">{meta.n}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h4 className="text-[13px] sm:text-[14px] tracking-[-0.01em] text-white/90 group-hover:text-white transition-colors">{meta.label}</h4>
            <span className="mono text-[12px] tracking-[0.08em] text-white/50">
              {explanation?.earned ?? 0} <span className="text-white/25">/ {explanation?.max ?? 0}</span>
            </span>
          </div>
          {explanation?.detail && <p className="mt-1.5 text-[13px] leading-[1.5] text-white/45">{explanation.detail}</p>}
          <div className="mt-3 h-px w-full bg-white/[0.07] relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-[#6B7CFF] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          {/* expanded */}
          {isOpen && explanation && (
            <div className="mt-5 grid sm:grid-cols-3 gap-5 border-t border-white/[0.06] pt-5 animate-[fadeIn_0.3s_ease]">
              <div>
                <p className="mono text-[10px] tracking-[0.14em] text-white/30">STATUS</p>
                <p className="mono mt-2 text-[11px] tracking-[0.12em] text-white/80">{status}</p>
              </div>
              <div>
                <p className="mono text-[10px] tracking-[0.14em] text-white/30">WHAT WE DETECTED</p>
                <p className="mt-2 text-[13px] leading-[1.6] text-white/60">{explanation.detail || '—'}</p>
              </div>
              <div>
                <p className="mono text-[10px] tracking-[0.14em] text-white/30">HOW TO IMPROVE</p>
                <p className="mt-2 text-[13px] leading-[1.6] text-white/60">{explanation.improvement || 'Well done — no changes needed.'}</p>
              </div>
            </div>
          )}
        </div>
        <span className={`shrink-0 w-7 h-7 border flex items-center justify-center mt-0.5 transition-colors ${isOpen ? 'border-white/20 bg-white text-black' : 'border-white/15 text-white/40 group-hover:border-white/25 group-hover:text-white/70'}`}>
          <span className="text-[14px] leading-none" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>{isOpen ? '×' : '+'}</span>
        </span>
      </button>
    </div>
  )
}

export default function AnalysisResults({ result, onReset }) {
  const [expandedText, setExpandedText] = useState(false)
  const [open, setOpen] = useState(() => new Set())

  const toggle = useCallback((key) => {
    setOpen(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n })
  }, [])

  if (!result || !result.analysis) return null

  // CRITICAL: map to EXACT backend schema — do not guess
  const a = result.analysis
  const m = a.metrics
  const score = a.engagement_score
  const breakdown = a.score_breakdown
  const explanations = a.score_explanations
  const suitability = a.suitability || { label: 'unknown', reasons: [] }
  const strengths = a.strengths || []
  const improvements = a.improvements || []

  const interp = scoreMeta(score)
  const isDoc = suitability.label === 'likely_document'
  const sLabel = suitabilityDisplay(suitability.label)

  const extractionLabel = result.extraction_method === 'pdf_ocr' ? 'OCR (SCANNED PDF)' : result.extraction_method === 'image_ocr' ? 'OCR (IMAGE)' : 'PDF TEXT'

  return (
    <div className="bg-[#050505]">
      {/* ANALYSIS HEADER */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="mono text-[10px] tracking-[0.18em] text-white/35">ANALYSIS / 01</p>
            <button onClick={onReset} className="mono text-[10px] tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors">← NEW UPLOAD</button>
          </div>
          <h2 className="mt-4 text-[18px] sm:text-[20px] tracking-[-0.02em] text-white/90 truncate">{result.filename}</h2>
          <p className="mono mt-2 text-[10px] tracking-[0.14em] text-white/30">
            {result.file_type?.toUpperCase()} · {result.page_count} PAGE{result.page_count !== 1 ? 'S' : ''} · {extractionLabel}
          </p>
        </div>
      </section>

      {/* SCORE — editorial dominant */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-10 sm:py-14 lg:py-16">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-start">
            <div>
              <p className="mono text-[10px] tracking-[0.18em] text-white/35">ENGAGEMENT SCORE</p>
              <div className="mt-6 flex gap-6 sm:gap-8 items-start">
                <ScoreRing score={score} />
                <div className="pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[48px] sm:text-[56px] font-[300] tracking-[-0.05em] leading-none text-[#F2EFE8]">{score}</span>
                    <span className="mono text-[11px] tracking-[0.14em] text-white/30">/ 100</span>
                  </div>
                  <p className="mono mt-2 text-[11px] tracking-[0.16em] text-white/70">{interp.label}</p>
                  <p className="mt-3 max-w-[36ch] text-[14px] leading-[1.6] text-white/45">“{interp.desc}”</p>
                  {isDoc && <p className="mt-3 mono text-[11px] leading-[1.6] tracking-[0.04em] text-amber-300/60">Engagement scoring may not be representative for this type of content.</p>}
                  <p className="mono mt-4 text-[10px] tracking-[0.12em] text-white/20">Heuristic analysis — not a scientific prediction</p>
                </div>
              </div>
            </div>

            {/* Suitability — prominent but elegant */}
            <div className="lg:pl-8 lg:border-l lg:border-white/[0.07]">
              <p className="mono text-[10px] tracking-[0.18em] text-white/35">CONTENT TYPE</p>
              <p className={`mt-4 text-[16px] sm:text-[18px] tracking-[-0.02em] leading-tight ${isDoc ? 'text-amber-200/90' : sLabel.includes('LIKELY SOCIAL') ? 'text-[#C2C8FF]' : 'text-white/80'}`}>
                {sLabel}
              </p>
              {suitability.reasons?.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {suitability.reasons.map((r, i) => (
                    <li key={i} className="text-[13px] leading-[1.6] text-white/45 pl-3 border-l border-white/10">{r}</li>
                  ))}
                </ul>
              )}
              {isDoc && (
                <p className="mt-4 text-[13px] leading-[1.65] text-white/35">
                  This content contains document-style characteristics such as headings, citations, or technical structure. Engagement scoring may not accurately represent social-media performance.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* METRICS — premium data strip */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
          <p className="mono text-[10px] tracking-[0.18em] text-white/35">CONTENT METRICS</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] border-y sm:border border-white/[0.07]">
            {[
              { v: m.word_count, l: 'WORDS' },
              { v: m.character_count, l: 'CHARACTERS' },
              { v: m.sentence_count, l: 'SENTENCES' },
              { v: m.hashtag_count, l: 'HASHTAGS' },
              { v: m.question_count, l: 'QUESTIONS' },
            ].map(it => (
              <div key={it.l} className="px-5 sm:px-6 py-6 sm:py-7">
                <p className="text-[28px] sm:text-[30px] font-[300] tracking-[-0.03em] leading-none text-[#F2EFE8]">{Number(it.v).toLocaleString()}</p>
                <p className="mono mt-2 text-[10px] tracking-[0.14em] text-white/30">{it.l}</p>
              </div>
            ))}
          </div>
          {/* secondary line — avg length etc subtle */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 mono text-[10px] tracking-[0.10em] text-white/25">
            <span>AVG WORDS / SENTENCE — {m.average_sentence_length}</span>
            <span className="hidden sm:inline text-white/10">·</span>
            <span>EXCLAMATIONS — {m.exclamation_count}</span>
            <span className="hidden sm:inline text-white/10">·</span>
            <span>EMOJIS — {m.emoji_count}</span>
          </div>
        </div>
      </section>

      {/* BREAKDOWN */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="text-[18px] sm:text-[20px] tracking-[-0.02em] text-white/90">SCORE BREAKDOWN</h3>
            <p className="mono text-[10px] tracking-[0.12em] text-white/30">See exactly what contributed to your score.</p>
          </div>
          <div className="mt-6 border-t border-white/[0.07]">
            {SCORE_META.map(meta => (
              <BreakdownRow
                key={meta.key}
                meta={meta}
                explanation={explanations?.[meta.key]}
                isOpen={open.has(meta.key)}
                onToggle={() => toggle(meta.key)}
              />
            ))}
          </div>
          {/* verify sum hint */}
          <p className="mono mt-4 text-[10px] tracking-[0.10em] text-white/20">Σ SCORE_BREAKDOWN = {Object.values(breakdown || {}).reduce((a,b)=>a+Number(b||0),0)} · ENGAGEMENT_SCORE = {score}</p>
        </div>
      </section>

      {/* INSIGHTS */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <section className="border-b border-white/[0.07]">
          <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">
              <div>
                <p className="mono text-[10px] tracking-[0.18em] text-white/35">WHAT'S WORKING</p>
                <div className="mt-5 border-t border-white/[0.07]">
                  {strengths.length ? strengths.map((s, i) => (
                    <div key={i} className="flex gap-4 py-4 border-b border-white/[0.04]">
                      <span className="mono text-[11px] tracking-[0.10em] text-white/20 mt-0.5">{String(i+1).padStart(2,'0')}</span>
                      <p className="text-[14px] leading-[1.6] text-white/70">{s}</p>
                    </div>
                  )) : <p className="mono mt-4 text-[12px] text-white/25">—</p>}
                </div>
              </div>
              <div>
                <p className="mono text-[10px] tracking-[0.18em] text-white/35">WHAT COULD IMPROVE</p>
                <div className="mt-5 border-t border-white/[0.07]">
                  {improvements.length ? improvements.map((s, i) => (
                    <div key={i} className="flex gap-4 py-4 border-b border-white/[0.04]">
                      <span className="mono text-[11px] tracking-[0.10em] text-white/20 mt-0.5">{String(i+1).padStart(2,'0')}</span>
                      <p className="text-[14px] leading-[1.6] text-white/70">{s}</p>
                    </div>
                  )) : <p className="mono mt-4 text-[12px] text-white/25">—</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EXTRACTED TEXT */}
      {result.extracted_text && (
        <section className="border-b border-white/[0.07]">
          <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
            <button type="button" onClick={() => setExpandedText(!expandedText)} className="w-full text-left group">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[18px] tracking-[-0.02em] text-white/90 group-hover:text-white transition-colors">EXTRACTED TEXT</h3>
                <span className="shrink-0 mono text-[10px] tracking-[0.14em] border border-white/15 px-3 py-1.5 text-white/60 group-hover:border-white/25 group-hover:text-white/90 transition-colors">{expandedText ? 'HIDE' : 'SHOW'}</span>
              </div>
              <p className="mono mt-2 text-[10px] tracking-[0.12em] text-white/30">{extractionLabel} · {result.page_count} PAGE{result.page_count!==1?'S':''} · {result.word_count.toLocaleString()} WORDS · {result.character_count.toLocaleString()} CHARACTERS</p>
            </button>
            {expandedText && (
              <div className="mt-6 border border-white/[0.07] bg-white/[0.02] max-h-[420px] overflow-auto">
                <pre className="p-6 sm:p-8 text-[14px] leading-[1.75] text-white/65 whitespace-pre-wrap font-[400]" style={{ fontFamily: 'Instrument Sans, system-ui, sans-serif' }}>{result.extracted_text}</pre>
              </div>
            )}
          </div>
        </section>
      )}

      {/* DOWNLOAD */}
      <section>
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
          <p className="mono text-[10px] tracking-[0.18em] text-white/35">ORIGINAL FILE</p>
          <p className="mt-3 text-[13px] leading-[1.6] text-white/45">Download the exact file you uploaded.</p>
          {result.download_id ? (
            <a href={`/api/download/${result.download_id}`} download={result.filename} className="mt-5 inline-flex mono text-[11px] tracking-[0.16em] border border-white/15 px-6 py-3 text-white/90 hover:bg-white hover:text-black transition-colors">
              DOWNLOAD ORIGINAL FILE
            </a>
          ) : (
            <p className="mono mt-4 text-[11px] text-white/25">Download not available for this file.</p>
          )}
        </div>
      </section>
    </div>
  )
}
