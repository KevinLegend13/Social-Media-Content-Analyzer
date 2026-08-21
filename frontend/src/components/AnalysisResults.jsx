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

function suitabilityDisplay(contentType, label) {
  const t = (contentType || label || '').toLowerCase()
  if (t === 'social_media' || t === 'likely_social_media') return 'SOCIAL MEDIA CONTENT'
  if (t === 'technical_document') return 'TECHNICAL DOCUMENT'
  if (t === 'academic_document') return 'ACADEMIC DOCUMENT'
  if (t === 'report') return 'REPORT / PROJECT DOCUMENT'
  if (t === 'article') return 'ARTICLE / LONGFORM'
  if (t === 'possibly_social_media') return 'POSSIBLY SOCIAL MEDIA'
  if (t === 'likely_document') return 'DOCUMENT CONTENT'
  return 'UNSPECIFIED CONTENT'
}

function statusConfig(status) {
  const s = (status || 'missing').toLowerCase()
  if (s === 'good') return { label: 'GOOD', style: 'text-[#6EE7B7] bg-[#6EE7B7]/10 border-[#6EE7B7]/25' }
  if (s === 'ok') return { label: 'OK', style: 'text-[#C2C8FF] bg-[#6B7CFF]/10 border-[#6B7CFF]/25' }
  if (s === 'needs_improvement') return { label: 'NEEDS IMPROVEMENT', style: 'text-[#FBBF24] bg-[#F59E0B]/10 border-[#F59E0B]/25' }
  return { label: 'MISSING', style: 'text-[#F87171] bg-[#EF4444]/10 border-[#EF4444]/25' }
}

function exportTxt(result) {
  const a = result.analysis || {}
  const m = a.metrics || {}
  const score = a.engagement_score ?? 0
  const suitability = a.suitability || {}
  const contentType = a.content_type || suitability.content_type || suitability.label || 'Unknown'
  const scoreApplicability = (a.score_applicability || suitability.score_applicability || 'medium').toUpperCase()
  const scoreApplicabilityReason = a.score_applicability_reason || suitability.score_applicability_reason || ''
  const ai = result.ai_analysis
  const explanations = a.score_explanations || {}
  const dateStr = new Date().toLocaleString()

  let txt = `==================================================\n`
  txt += `SOCIAL MEDIA CONTENT ANALYZER REPORT\n`
  txt += `==================================================\n\n`
  txt += `File: ${result.filename || 'Unknown'}\n`
  txt += `File Type: ${(result.file_type || '').toUpperCase()}\n`
  txt += `Pages: ${result.page_count || 1}\n`
  txt += `Extraction Method: ${result.extraction_method || 'PDF TEXT'}\n`
  txt += `Analysis Date: ${dateStr}\n\n`

  txt += `--------------------------------------------------\n`
  txt += `ENGAGEMENT SCORE\n`
  txt += `--------------------------------------------------\n`
  txt += `Score: ${score} / 100\n\n`

  txt += `--------------------------------------------------\n`
  txt += `CONTENT CLASSIFICATION & SUITABILITY\n`
  txt += `--------------------------------------------------\n`
  txt += `Content Type: ${contentType}\n`
  txt += `Suitability: ${suitability.label || 'unknown'}\n`
  txt += `Score Applicability: ${scoreApplicability}\n`
  if (scoreApplicabilityReason) {
    txt += `Reason: ${scoreApplicabilityReason}\n`
  }
  if (suitability.reasons && suitability.reasons.length > 0) {
    txt += `Signals:\n`
    suitability.reasons.forEach(r => txt += `  - ${r}\n`)
  }
  txt += `\n`

  txt += `--------------------------------------------------\n`
  txt += `AI INTERPRETATION (GEMINI)\n`
  txt += `--------------------------------------------------\n`
  if (ai) {
    txt += `SUMMARY:\n${ai.summary || 'N/A'}\n\n`
    if (ai.strengths && ai.strengths.length > 0) {
      txt += `WHAT'S WORKING:\n`
      ai.strengths.forEach(s => txt += `  ✓ ${s}\n`)
      txt += `\n`
    }
    if (ai.improvements && ai.improvements.length > 0) {
      txt += `WHAT COULD IMPROVE:\n`
      ai.improvements.forEach(imp => txt += `  → ${imp}\n`)
      txt += `\n`
    }
    if (ai.priority_actions && ai.priority_actions.length > 0) {
      txt += `PRIORITY ACTIONS:\n`
      ai.priority_actions.forEach(act => {
        txt += `  [${(act.priority || 'MEDIUM').toUpperCase()}] ${act.action}\n`
        if (act.reason) txt += `    Reason: ${act.reason}\n`
      })
      txt += `\n`
    }
  } else {
    txt += `AI interpretation unavailable — rule-based insights shown.\n\n`
  }

  txt += `--------------------------------------------------\n`
  txt += `CONTENT METRICS\n`
  txt += `--------------------------------------------------\n`
  txt += `Words: ${m.word_count ?? 0}\n`
  txt += `Characters: ${m.character_count ?? 0}\n`
  txt += `Sentences: ${m.sentence_count ?? 0}\n`
  txt += `Average Words / Sentence: ${m.average_sentence_length ?? 0}\n`
  txt += `Hashtags: ${m.hashtag_count ?? 0}\n`
  txt += `Questions: ${m.question_count ?? 0}\n`
  txt += `Exclamations: ${m.exclamation_count ?? 0}\n`
  txt += `Emojis: ${m.emoji_count ?? 0}\n`
  txt += `Line Breaks: ${m.line_break_count ?? 0}\n`
  txt += `Call To Action: ${m.has_cta ? 'Yes' : 'No'}\n`
  txt += `Hook / Opener: ${m.has_hook ? 'Yes' : 'No'}\n`
  txt += `Bullet Points: ${m.has_bullet_points ? 'Yes' : 'No'}\n\n`

  txt += `--------------------------------------------------\n`
  txt += `SCORE BREAKDOWN\n`
  txt += `--------------------------------------------------\n`
  SCORE_META.forEach(meta => {
    const exp = explanations[meta.key] || {}
    txt += `${meta.label}: ${exp.earned ?? 0} / ${exp.max ?? 0} (Status: ${(exp.status || 'missing').toUpperCase()})\n`
    if (exp.detail) txt += `  Detail: ${exp.detail}\n`
    if (exp.improvement) txt += `  Improvement: ${exp.improvement}\n`
    txt += `\n`
  })

  if ((a.strengths && a.strengths.length > 0) || (a.improvements && a.improvements.length > 0)) {
    txt += `--------------------------------------------------\n`
    txt += `NEXT STEPS / RULE-BASED INSIGHTS\n`
    txt += `--------------------------------------------------\n`
    if (a.strengths && a.strengths.length > 0) {
      txt += `Strengths:\n`
      a.strengths.forEach(s => txt += `  - ${s}\n`)
      txt += `\n`
    }
    if (a.improvements && a.improvements.length > 0) {
      txt += `Areas For Improvement:\n`
      a.improvements.forEach(imp => txt += `  - ${imp}\n`)
      txt += `\n`
    }
  }

  if (result.extracted_text) {
    txt += `--------------------------------------------------\n`
    txt += `EXTRACTED CONTENT\n`
    txt += `--------------------------------------------------\n`
    txt += `${result.extracted_text}\n`
  }

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
  const baseName = (result.filename || 'report').replace(/\.[^/.]+$/, '')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${baseName}-analysis.txt`
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportMd(result) {
  const a = result.analysis || {}
  const m = a.metrics || {}
  const score = a.engagement_score ?? 0
  const suitability = a.suitability || {}
  const contentType = a.content_type || suitability.content_type || suitability.label || 'Unknown'
  const scoreApplicability = (a.score_applicability || suitability.score_applicability || 'medium').toUpperCase()
  const scoreApplicabilityReason = a.score_applicability_reason || suitability.score_applicability_reason || ''
  const ai = result.ai_analysis
  const explanations = a.score_explanations || {}
  const dateStr = new Date().toLocaleString()

  let md = `# Social Media Content Analyzer Report\n\n`
  md += `## File Information\n\n`
  md += `- **Name:** ${result.filename || 'Unknown'}\n`
  md += `- **Type:** ${(result.file_type || '').toUpperCase()}\n`
  md += `- **Page Count:** ${result.page_count || 1}\n`
  md += `- **Extraction Method:** ${result.extraction_method || 'PDF TEXT'}\n`
  md += `- **Analysis Date:** ${dateStr}\n\n`

  md += `## Engagement Score\n\n`
  md += `**${score} / 100**\n\n`

  md += `## Content Classification & Suitability\n\n`
  md += `- **Content Type:** ${contentType}\n`
  md += `- **Suitability:** ${suitability.label || 'unknown'}\n`
  md += `- **Score Applicability:** **${scoreApplicability}**\n`
  if (scoreApplicabilityReason) {
    md += `\n> **Note:** ${scoreApplicabilityReason}\n`
  }
  md += `\n`

  md += `## AI Interpretation (Gemini)\n\n`
  if (ai) {
    md += `### Summary\n\n${ai.summary || 'N/A'}\n\n`
    if (ai.strengths && ai.strengths.length > 0) {
      md += `### What's Working\n\n`
      ai.strengths.forEach(s => md += `- ${s}\n`)
      md += `\n`
    }
    if (ai.improvements && ai.improvements.length > 0) {
      md += `### What Could Improve\n\n`
      ai.improvements.forEach(imp => md += `- ${imp}\n`)
      md += `\n`
    }
    if (ai.priority_actions && ai.priority_actions.length > 0) {
      md += `### Priority Actions\n\n`
      ai.priority_actions.forEach(act => {
        md += `- **[${(act.priority || 'MEDIUM').toUpperCase()}]** ${act.action}\n`
        if (act.reason) md += `  - *Reason:* ${act.reason}\n`
      })
      md += `\n`
    }
  } else {
    md += `*AI interpretation unavailable — rule-based insights shown.*\n\n`
  }

  md += `## Content Metrics\n\n`
  md += `| Metric | Value |\n`
  md += `|---|---:|\n`
  md += `| Words | ${m.word_count ?? 0} |\n`
  md += `| Characters | ${m.character_count ?? 0} |\n`
  md += `| Sentences | ${m.sentence_count ?? 0} |\n`
  md += `| Avg Words / Sentence | ${m.average_sentence_length ?? 0} |\n`
  md += `| Hashtags | ${m.hashtag_count ?? 0} |\n`
  md += `| Questions | ${m.question_count ?? 0} |\n`
  md += `| Exclamations | ${m.exclamation_count ?? 0} |\n`
  md += `| Emojis | ${m.emoji_count ?? 0} |\n`
  md += `| Line Breaks | ${m.line_break_count ?? 0} |\n`
  md += `| Call To Action | ${m.has_cta ? 'Yes' : 'No'} |\n`
  md += `| Hook / Opener | ${m.has_hook ? 'Yes' : 'No'} |\n`
  md += `| Bullet Points | ${m.has_bullet_points ? 'Yes' : 'No'} |\n\n`

  md += `## Score Breakdown\n\n`
  md += `| Component | Score | Status |\n`
  md += `|---|---:|---|\n`
  SCORE_META.forEach(meta => {
    const exp = explanations[meta.key] || {}
    md += `| ${meta.label} | ${exp.earned ?? 0}/${exp.max ?? 0} | ${(exp.status || 'missing').toUpperCase()} |\n`
  })
  md += `\n### Score Component Details\n\n`
  SCORE_META.forEach(meta => {
    const exp = explanations[meta.key] || {}
    md += `#### ${meta.label}\n`
    md += `- **Score:** ${exp.earned ?? 0} / ${exp.max ?? 0}\n`
    md += `- **Detail:** ${exp.detail || '—'}\n`
    md += `- **Improvement:** ${exp.improvement || 'Well done — no changes needed.'}\n\n`
  })

  if ((a.strengths && a.strengths.length > 0) || (a.improvements && a.improvements.length > 0)) {
    md += `## Next Steps / Rule-Based Insights\n\n`
    if (a.strengths && a.strengths.length > 0) {
      md += `### Strengths Detected\n\n`
      a.strengths.forEach(s => md += `- ${s}\n`)
      md += `\n`
    }
    if (a.improvements && a.improvements.length > 0) {
      md += `### Areas For Improvement\n\n`
      a.improvements.forEach(imp => md += `- ${imp}\n`)
      md += `\n`
    }
  }

  if (result.extracted_text) {
    md += `## Extracted Content\n\n\`\`\`text\n${result.extracted_text}\n\`\`\`\n`
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const baseName = (result.filename || 'report').replace(/\.[^/.]+$/, '')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${baseName}-analysis.md`
  link.click()
  URL.revokeObjectURL(link.href)
}

function ScoreRing({ score }) {
  const m = scoreMeta(score)
  const size = 140
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
        <span className="text-[40px] font-[300] tracking-[-0.04em] leading-none text-[#F2EFE8]">{score}</span>
        <span className="mono text-[10px] tracking-[0.16em] text-white/30 mt-1">/ 100</span>
      </div>
    </div>
  )
}

function BreakdownRow({ meta, explanation, isOpen, onToggle }) {
  const earned = explanation?.earned ?? 0
  const max = explanation?.max ?? 0
  const pct = max > 0 ? Math.round((earned / max) * 100) : 0
  const st = statusConfig(explanation?.status)

  return (
    <div className="border-b border-white/[0.07] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left py-4 sm:py-5 flex gap-4 sm:gap-6 group transition-all duration-200 hover:bg-white/[0.02] px-2 sm:px-3 -mx-2 sm:-mx-3 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 cursor-pointer"
      >
        <span className="mono text-[11px] tracking-[0.12em] text-white/30 mt-0.5 shrink-0">{meta.n}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h4 className="text-[14px] tracking-[-0.01em] text-white/90 group-hover:text-[#C2C8FF] transition-colors">{meta.label}</h4>
            <span className="mono text-[12px] tracking-[0.08em] text-white/70">
              {earned} <span className="text-white/30">/ {max}</span>
            </span>
          </div>
          {explanation?.detail && <p className="mt-1 text-[13px] leading-[1.5] text-white/50">{explanation.detail}</p>}
          <div className="mt-3 h-1 w-full bg-white/[0.06] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#6B7CFF] group-hover:bg-[#8B5CF6] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className={`mt-4 grid sm:grid-cols-3 gap-4 border-t border-white/[0.06] print:border-gray-200 pt-4 ${isOpen ? 'block' : 'hidden print:grid'}`}>
            <div>
              <p className="mono text-[10px] tracking-[0.14em] text-white/35 print:text-gray-600 mb-1.5">STATUS</p>
              <span className={`mono text-[9px] tracking-[0.14em] px-2.5 py-1 border inline-block ${st.style}`}>
                {st.label}
              </span>
            </div>
            <div>
              <p className="mono text-[10px] tracking-[0.14em] text-white/35 print:text-gray-600">WHY YOU GOT THIS SCORE</p>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-white/70 print:text-gray-900">{explanation.detail || '—'}</p>
            </div>
            <div>
              <p className="mono text-[10px] tracking-[0.14em] text-white/35 print:text-gray-600">HOW TO IMPROVE</p>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-white/70 print:text-gray-900">{explanation.improvement || 'Well done — no changes needed.'}</p>
            </div>
          </div>
        </div>
        <span className={`shrink-0 w-7 h-7 border flex items-center justify-center mt-0.5 transition-all duration-200 ${isOpen ? 'border-[#8B5CF6]/60 bg-[#8B5CF6] text-white' : 'border-white/15 text-white/40 group-hover:border-[#8B5CF6]/50 group-hover:text-white'}`}>
          <span className="text-[14px] leading-none" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>{isOpen ? '×' : '+'}</span>
        </span>
      </button>
    </div>
  )
}

function AIInterpretation({ aiAnalysis }) {
  if (!aiAnalysis) {
    return (
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex items-center justify-between gap-4">
            <p className="mono text-[10px] tracking-[0.18em] text-white/35">AI INTERPRETATION</p>
            <span className="mono text-[9px] tracking-[0.12em] text-[#A78BFA]/60 border border-[#8B5CF6]/20 px-2 py-0.5">GEMINI</span>
          </div>
          <div className="mt-3 border border-white/[0.08] bg-white/[0.015] px-5 py-4">
            <p className="mono text-[11px] tracking-[0.06em] text-white/40">
              AI interpretation unavailable — showing rule-based insights.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const { summary, strengths, improvements, priority_actions } = aiAnalysis

  return (
    <section className="border-b border-white/[0.07]">
      <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <p className="mono text-[10px] tracking-[0.18em] text-[#A78BFA]">AI INTERPRETATION</p>
              <span className="mono text-[9px] tracking-[0.14em] text-[#A78BFA]/90 border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2 py-0.5">
                GEMINI
              </span>
            </div>
            <p className="mt-1 text-[13px] text-white/40">Gemini-powered explanation of your analysis</p>
          </div>
        </div>

        {summary && (
          <div className="mt-6 border border-white/[0.08] bg-white/[0.015] p-6 hover:border-[#8B5CF6]/30 transition-all duration-200">
            <p className="mono text-[10px] tracking-[0.16em] text-white/35">SUMMARY</p>
            <p className="mt-2 text-[14px] sm:text-[15px] leading-[1.7] text-white/85 font-[300]">
              {summary}
            </p>
          </div>
        )}

        {(strengths?.length > 0 || improvements?.length > 0) && (
          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <div className="border border-white/[0.08] bg-white/[0.015] p-5">
              <p className="mono text-[10px] tracking-[0.16em] text-white/35 flex items-center gap-2">
                <span className="text-[#6EE7B7]">✓</span> WHAT'S WORKING
              </p>
              <ul className="mt-3 divide-y divide-white/[0.05]">
                {strengths?.map((item, idx) => (
                  <li key={idx} className="py-2.5 flex gap-3 group transition-all duration-150 hover:pl-1">
                    <span className="text-[#6EE7B7] text-[13px] shrink-0 mt-0.5">✓</span>
                    <span className="text-[13px] leading-[1.6] text-white/75 group-hover:text-white transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-white/[0.08] bg-white/[0.015] p-5">
              <p className="mono text-[10px] tracking-[0.16em] text-white/35 flex items-center gap-2">
                <span className="text-[#FCA5A5]">→</span> WHAT COULD IMPROVE
              </p>
              <ul className="mt-3 divide-y divide-white/[0.05]">
                {improvements?.map((item, idx) => (
                  <li key={idx} className="py-2.5 flex gap-3 group transition-all duration-150 hover:pl-1">
                    <span className="text-[#FCA5A5] text-[13px] shrink-0 mt-0.5">→</span>
                    <span className="text-[13px] leading-[1.6] text-white/75 group-hover:text-white transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {priority_actions?.length > 0 && (
          <div className="mt-6 border border-white/[0.08] bg-white/[0.015] p-5">
            <p className="mono text-[10px] tracking-[0.16em] text-white/35 mb-4">PRIORITY ACTIONS</p>
            <div className="space-y-3">
              {priority_actions.map((act, idx) => {
                const prio = (act.priority || 'medium').toLowerCase()
                let badgeStyle = 'text-[#FBBF24] border-[#F59E0B]/30 bg-[#F59E0B]/10'
                if (prio === 'high') {
                  badgeStyle = 'text-[#F87171] border-[#EF4444]/30 bg-[#EF4444]/10'
                } else if (prio === 'low') {
                  badgeStyle = 'text-[#60A5FA] border-[#3B82F6]/30 bg-[#3B82F6]/10'
                }
                return (
                  <div
                    key={idx}
                    className="p-4 border border-white/[0.06] bg-white/[0.01] hover:border-[#8B5CF6]/40 hover:bg-white/[0.025] transition-all duration-200 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
                  >
                    <span className={`mono text-[9px] tracking-[0.16em] uppercase px-2.5 py-1 border shrink-0 w-fit ${badgeStyle}`}>
                      {prio}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-[400] text-white/90 tracking-[-0.01em]">
                        {act.action}
                      </h4>
                      {act.reason && (
                        <p className="mt-1 text-[13px] leading-[1.6] text-white/50">
                          {act.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function AnalysisResults({ result, onReset }) {
  const [expandedText, setExpandedText] = useState(false)
  const [open, setOpen] = useState(() => new Set())

  const toggle = useCallback((key) => {
    setOpen(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n })
  }, [])

  if (!result || !result.analysis) return null

  // Data binding strictly from API response
  const a = result.analysis
  const m = a.metrics || {}
  const score = a.engagement_score ?? 0
  const breakdown = a.score_breakdown || {}
  const explanations = a.score_explanations || {}
  const suitability = a.suitability || { label: 'unknown', reasons: [] }
  const contentType = a.content_type || suitability.content_type || suitability.label
  const scoreApplicability = (a.score_applicability || suitability.score_applicability || 'medium').toLowerCase()
  const scoreApplicabilityReason = a.score_applicability_reason || suitability.score_applicability_reason || ''
  const strengths = a.strengths || []
  const improvements = a.improvements || []

  const interp = scoreMeta(score)
  const isDoc = suitability.label === 'likely_document' || scoreApplicability === 'low'
  const sLabel = suitabilityDisplay(contentType, suitability.label)

  const extractionLabel = result.extraction_method === 'pdf_ocr' ? 'OCR (SCANNED PDF)' : result.extraction_method === 'image_ocr' ? 'OCR (IMAGE)' : 'PDF TEXT'

  return (
    <div className="bg-[#050505] min-h-screen text-[#F2EFE8]">
      {/* 1. FILE HEADER */}
      <header className="border-b border-white/[0.07] bg-[#0A0A0C]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-6 sm:py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="mono text-[10px] tracking-[0.18em] text-[#A78BFA]">ANALYSIS WORKSPACE</p>
              <span className="mono text-[9px] tracking-[0.14em] text-white/40 border border-white/10 px-2 py-0.5">
                v1.0
              </span>
            </div>
            <h2 className="mt-2 text-[20px] sm:text-[22px] font-[400] tracking-[-0.02em] text-white/95 truncate max-w-[40ch]">
              {result.filename}
            </h2>
            <p className="mono mt-1.5 text-[10px] tracking-[0.14em] text-white/40">
              {result.file_type?.toUpperCase()} · {result.page_count} PAGE{result.page_count !== 1 ? 'S' : ''} · {extractionLabel}
            </p>
          </div>
          <button
            onClick={onReset}
            className="mono text-[11px] tracking-[0.14em] px-4 py-2 border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#C2C8FF] hover:bg-[#8B5CF6] hover:text-white transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] no-print"
          >
            ← NEW UPLOAD
          </button>
        </div>
      </header>

      {/* 2. ENGAGEMENT SCORE + CONTENT TYPE */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-start">
            <div>
              <p className="mono text-[10px] tracking-[0.18em] text-white/35">ENGAGEMENT SCORE</p>
              <div className="mt-5 flex gap-6 sm:gap-8 items-start">
                <ScoreRing score={score} />
                <div className="pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[44px] sm:text-[52px] font-[300] tracking-[-0.05em] leading-none text-[#F2EFE8]">{score}</span>
                    <span className="mono text-[11px] tracking-[0.14em] text-white/30">/ 100</span>
                  </div>
                  <p className="mono mt-2 text-[11px] tracking-[0.16em] text-white/70">{interp.label}</p>
                  <p className="mt-2.5 max-w-[36ch] text-[13px] sm:text-[14px] leading-[1.6] text-white/50">“{interp.desc}”</p>
                  <p className="mono mt-3.5 text-[10px] tracking-[0.12em] text-white/25">Heuristic analysis — rule-based baseline</p>
                </div>
              </div>
            </div>

            {/* Content Type & Applicability */}
            <div className="lg:pl-8 lg:border-l lg:border-white/[0.07]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="mono text-[10px] tracking-[0.18em] text-white/35">CONTENT TYPE</p>
                {scoreApplicability && (
                  <span className={`mono text-[9px] tracking-[0.14em] px-2.5 py-0.5 border ${
                    scoreApplicability === 'low'
                      ? 'text-[#F87171] border-[#EF4444]/30 bg-[#EF4444]/10'
                      : scoreApplicability === 'medium'
                      ? 'text-[#FBBF24] border-[#F59E0B]/30 bg-[#F59E0B]/10'
                      : 'text-[#6EE7B7] border-[#10B981]/30 bg-[#10B981]/10'
                  }`}>
                    APPLICABILITY: {scoreApplicability.toUpperCase()}
                  </span>
                )}
              </div>

              <p className={`mt-3 text-[16px] sm:text-[18px] tracking-[-0.02em] font-[400] leading-tight ${isDoc ? 'text-amber-200/90' : sLabel.includes('SOCIAL') ? 'text-[#C2C8FF]' : 'text-white/85'}`}>
                {sLabel}
              </p>

              {suitability.reasons?.length > 0 && (
                <ul className="mt-3.5 space-y-1.5">
                  {suitability.reasons.map((r, i) => (
                    <li key={i} className="text-[13px] leading-[1.5] text-white/50 pl-3 border-l border-white/10">{r}</li>
                  ))}
                </ul>
              )}

              {scoreApplicability === 'low' && (
                <div className="mt-4 p-3.5 border border-amber-500/25 bg-amber-500/10">
                  <p className="mono text-[10px] tracking-[0.12em] text-amber-300/90 font-[500]">SCORE APPLICABILITY LOW</p>
                  <p className="mt-1 text-[12px] leading-[1.6] text-amber-200/70">
                    {scoreApplicabilityReason || 'The engagement score is designed for social-media content and may not meaningfully represent this document.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTENT METRICS */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <p className="mono text-[10px] tracking-[0.18em] text-white/35">CONTENT METRICS</p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] border-y sm:border border-white/[0.07] bg-white/[0.01]">
            {[
              { v: m.word_count, l: 'WORDS' },
              { v: m.character_count, l: 'CHARACTERS' },
              { v: m.sentence_count, l: 'SENTENCES' },
              { v: m.hashtag_count, l: 'HASHTAGS' },
              { v: m.question_count, l: 'QUESTIONS' },
            ].map(it => (
              <div key={it.l} className="px-5 py-5 sm:py-6">
                <p className="text-[26px] sm:text-[28px] font-[300] tracking-[-0.03em] leading-none text-[#F2EFE8]">{Number(it.v || 0).toLocaleString()}</p>
                <p className="mono mt-2 text-[10px] tracking-[0.14em] text-white/35">{it.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 mono text-[10px] tracking-[0.10em] text-white/30">
            <span>AVG WORDS / SENTENCE — {m.average_sentence_length ?? 0}</span>
            <span className="hidden sm:inline text-white/10">·</span>
            <span>EXCLAMATIONS — {m.exclamation_count ?? 0}</span>
            <span className="hidden sm:inline text-white/10">·</span>
            <span>EMOJIS — {m.emoji_count ?? 0}</span>
          </div>
        </div>
      </section>

      {/* 4. AI INTERPRETATION */}
      <AIInterpretation aiAnalysis={result.ai_analysis} />

      {/* 5. SCORE BREAKDOWN */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h3 className="text-[18px] sm:text-[20px] tracking-[-0.02em] text-white/90">SCORE BREAKDOWN</h3>
              <p className="mono mt-1 text-[10px] tracking-[0.12em] text-white/35">See exactly what contributed to your score.</p>
            </div>
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

          <div className="mt-8 border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mono text-[10px] tracking-[0.16em] text-white/35">TOTAL SCORE</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[28px] sm:text-[32px] font-[300] tracking-[-0.04em] text-[#F2EFE8]">{score}</span>
                <span className="mono text-[11px] tracking-[0.14em] text-white/30">/ 100</span>
              </div>
            </div>
            <p className="mono text-[10px] tracking-[0.10em] text-white/35 max-w-[40ch] text-left sm:text-right">
              Score components add up to the final engagement score.
            </p>
          </div>
        </div>
      </section>

      {/* 6. NEXT STEPS / ACTIONABLE INSIGHTS */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <section className="border-b border-white/[0.07]">
          <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
            <p className="mono text-[10px] tracking-[0.18em] text-white/35">RULE-BASED ANALYSIS INSIGHTS</p>
            <div className="mt-5 grid lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="border border-white/[0.08] bg-white/[0.015] p-5">
                <p className="mono text-[10px] tracking-[0.16em] text-white/35 flex items-center gap-2">
                  <span className="text-[#6EE7B7]">✓</span> STRENGTHS DETECTED
                </p>
                <div className="mt-3 border-t border-white/[0.05]">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex gap-3 py-3 border-b border-white/[0.04] last:border-b-0">
                      <span className="mono text-[11px] text-white/30 mt-0.5">{String(i+1).padStart(2,'0')}</span>
                      <p className="text-[13px] leading-[1.6] text-white/75">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/[0.08] bg-white/[0.015] p-5">
                <p className="mono text-[10px] tracking-[0.16em] text-white/35 flex items-center gap-2">
                  <span className="text-[#FCA5A5]">→</span> AREAS FOR IMPROVEMENT
                </p>
                <div className="mt-3 border-t border-white/[0.05]">
                  {improvements.map((s, i) => (
                    <div key={i} className="flex gap-3 py-3 border-b border-white/[0.04] last:border-b-0">
                      <span className="mono text-[11px] text-white/30 mt-0.5">{String(i+1).padStart(2,'0')}</span>
                      <p className="text-[13px] leading-[1.6] text-white/75">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. EXTRACTED TEXT */}
      {result.extracted_text && (
        <section className="border-b border-white/[0.07]">
          <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
            <button
              type="button"
              onClick={() => setExpandedText(!expandedText)}
              className="w-full text-left group focus:outline-none cursor-pointer no-print"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[18px] tracking-[-0.02em] text-white/90 group-hover:text-[#C2C8FF] transition-colors">EXTRACTED TEXT</h3>
                <span className="shrink-0 mono text-[10px] tracking-[0.14em] border border-white/15 px-3 py-1 text-white/60 group-hover:border-[#8B5CF6]/50 group-hover:text-white transition-all duration-200">
                  {expandedText ? 'HIDE' : 'SHOW'}
                </span>
              </div>
              <p className="mono mt-1.5 text-[10px] tracking-[0.12em] text-white/35">
                {extractionLabel} · {result.page_count} PAGE{result.page_count!==1?'S':''} · {result.word_count?.toLocaleString()} WORDS · {result.character_count?.toLocaleString()} CHARACTERS
              </p>
            </button>
            <div className={`mt-5 border border-white/[0.07] bg-white/[0.015] max-h-[420px] print:max-h-none overflow-auto ${expandedText ? 'block' : 'hidden print:block'}`}>
              <pre className="p-6 text-[13px] sm:text-[14px] leading-[1.75] text-white/70 print:text-gray-900 whitespace-pre-wrap font-[400]" style={{ fontFamily: 'Instrument Sans, system-ui, sans-serif' }}>
                {result.extracted_text}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* 8. REPORT EXPORT */}
      <section className="border-b border-white/[0.07] no-print">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mono text-[10px] tracking-[0.18em] text-[#A78BFA]">REPORT</p>
              <h3 className="mt-1 text-[16px] sm:text-[18px] tracking-[-0.02em] text-white/90">Analysis Report Export</h3>
              <p className="mt-1 text-[13px] text-white/45">Download or print the complete analysis report.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="mono text-[11px] tracking-[0.14em] px-4 py-2.5 border border-[#8B5CF6]/50 bg-[#8B5CF6]/15 text-[#C2C8FF] hover:bg-[#8B5CF6] hover:text-white transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              >
                [ ↓ PDF ]
              </button>
              <button
                type="button"
                onClick={() => exportTxt(result)}
                className="mono text-[11px] tracking-[0.14em] px-4 py-2.5 border border-white/20 text-white/90 hover:border-[#8B5CF6]/50 hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              >
                [ ↓ TXT ]
              </button>
              <button
                type="button"
                onClick={() => exportMd(result)}
                className="mono text-[11px] tracking-[0.14em] px-4 py-2.5 border border-white/20 text-white/90 hover:border-[#8B5CF6]/50 hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              >
                [ ↓ MD ]
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ORIGINAL UPLOAD / DOWNLOAD */}
      <section className="no-print">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <p className="mono text-[10px] tracking-[0.18em] text-white/35">ORIGINAL FILE</p>
          <p className="mt-2 text-[13px] leading-[1.6] text-white/50">Download the original uploaded file from storage.</p>
          {result.download_id ? (
            <a
              href={`/api/download/${result.download_id}`}
              download={result.filename}
              className="mt-4 inline-flex mono text-[11px] tracking-[0.14em] border border-white/20 px-5 py-2.5 text-white/90 hover:border-[#8B5CF6]/50 hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              DOWNLOAD ORIGINAL FILE
            </a>
          ) : (
            <p className="mono mt-3 text-[11px] text-white/25">Download not available for this file.</p>
          )}
        </div>
      </section>
    </div>
  )
}
