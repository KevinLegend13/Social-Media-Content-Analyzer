import { useState } from 'react'

const SCORE_COMPONENTS = [
  { key: 'length', label: 'Content Length', max: 15, description: 'Optimal 40–100 words' },
  { key: 'hashtags', label: 'Hashtags', max: 15, description: '2–4 is ideal' },
  { key: 'questions', label: 'Questions', max: 10, description: 'Invites interaction' },
  { key: 'cta', label: 'Call to Action', max: 15, description: 'Drives engagement' },
  { key: 'hook', label: 'Hook / Opener', max: 10, description: 'Stops the scroll' },
  { key: 'readability', label: 'Readability', max: 10, description: 'Sentence clarity' },
  { key: 'formatting', label: 'Formatting', max: 10, description: 'Scannability' },
  { key: 'energy', label: 'Energy', max: 10, description: 'Exclamations + emojis' },
  { key: 'variety', label: 'Sentence Variety', max: 5, description: 'Mixed lengths' },
]

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function barColor(pct) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-red-400'
}

function Badge({ active, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-50 text-gray-500 border-gray-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {label}
    </span>
  )
}

export default function AnalysisResults({ result, onReset }) {
  const [expandedText, setExpandedText] = useState(false)

  if (!result || !result.analysis) return null

  const a = result.analysis
  const m = a.metrics
  const b = a.score_breakdown
  const score = a.engagement_score

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">

      {/* Header card */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{result.filename} &bull; {result.file_type.toUpperCase()} &bull; {result.page_count} page{result.page_count !== 1 ? 's' : ''}</p>
          <p className="text-xs text-gray-400 mt-1">
            {result.extraction_method === 'pdf_ocr' && 'OCR (scanned PDF)'}
            {result.extraction_method === 'image_ocr' && 'OCR (image)'}
            {result.extraction_method === 'pdf_text' && 'PDF text extraction'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Upload another
        </button>
      </div>

      {/* Score hero */}
      <div className={`rounded-2xl border p-6 text-center ${scoreColor(score)}`}>
        <p className="text-sm font-medium uppercase tracking-wide opacity-70">Engagement Score</p>
        <p className="text-6xl font-bold mt-1">{score}<span className="text-2xl font-normal opacity-50">/100</span></p>
        <p className="text-sm mt-2 opacity-70">
          {score >= 80 ? 'Strong engagement potential' : score >= 60 ? 'Decent, room to improve' : 'Needs improvement'}
        </p>
      </div>

      {/* Score breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Score Breakdown</h2>
        <div className="space-y-3">
          {SCORE_COMPONENTS.map(({ key, label, max, description }) => {
            const val = b[key] ?? 0
            const pct = max > 0 ? Math.round((val / max) * 100) : 0
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-700 font-medium">{label}</span>
                    <span className="text-xs text-gray-400">{description}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">{val}<span className="text-gray-400">/{max}</span></span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard label="Words" value={m.word_count.toLocaleString()} />
        <MetricCard label="Characters" value={m.character_count.toLocaleString()} />
        <MetricCard label="Sentences" value={m.sentence_count.toLocaleString()} />
        <MetricCard label="Avg Sentence Length" value={`${m.average_sentence_length} words`} />
        <MetricCard label="Hashtags" value={m.hashtag_count.toLocaleString()} />
        <MetricCard label="Questions" value={m.question_count.toLocaleString()} />
      </div>

      {/* Status badges */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Content Features</h2>
        <div className="flex flex-wrap gap-2">
          <Badge active={m.has_cta} label={m.has_cta ? `CTA: ${m.cta_found.join(', ')}` : 'No CTA'} />
          <Badge active={m.has_hook} label="Hook" />
          <Badge active={m.has_bullet_points} label="Bullet Points" />
        </div>
      </div>

      {/* Suggestions */}
      {a.suggestions && a.suggestions.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-blue-900 mb-3">Actionable Suggestions</h2>
          <ul className="space-y-2">
            {a.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted text */}
      {result.extracted_text && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedText(!expandedText)}
            className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Extracted Text</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {result.word_count.toLocaleString()} words &bull; {result.character_count.toLocaleString()} characters
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedText ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedText && (
            <div className="px-5 pb-5 max-h-80 overflow-y-auto border-t border-gray-100">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed pt-4">
                {result.extracted_text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
