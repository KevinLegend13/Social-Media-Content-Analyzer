import { useState, useRef, useCallback } from 'react'
import { getApiUrl } from '../api'

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function getFileExtension(name) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.substring(idx).toLowerCase() : ''
}
function validateFile(file) {
  const ext = getFileExtension(file.name)
  if (!ACCEPTED_EXTENSIONS.includes(ext)) return `Unsupported file type "${ext}". Accepted: PDF, PNG, JPG, JPEG.`
  if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') return 'Invalid file type. Accepted: PDF, PNG, JPG, JPEG.'
  if (file.size === 0) return 'File is empty. Please upload a valid file.'
  if (file.size > MAX_SIZE_BYTES) return `File too large. Maximum size is 10 MB.`
  return null
}

export default function FileUpload({ onFileValidated }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) { setError(validationError); return }
    setSelectedFile(file)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(getApiUrl('/api/upload'), { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) {
        const message = data.detail?.message || data.detail || 'Upload failed.'
        setError(typeof message === 'string' ? message : 'Upload failed.')
        setUploading(false); setSelectedFile(null); return
      }
      setUploading(false)
      if (onFileValidated) onFileValidated(data)
    } catch {
      setError('Network error. Please check if the server is running.')
      setUploading(false); setSelectedFile(null)
    }
  }, [onFileValidated])

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.length) processFile(e.dataTransfer.files[0])
  }, [processFile])
  const handleChange = useCallback((e) => { if (e.target.files?.length) processFile(e.target.files[0]) }, [processFile])
  const handleBrowse = useCallback(() => inputRef.current?.click(), [])

  return (
    <div className="bg-[#050505]">
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleChange} className="hidden" />

      {/* HERO — cinematic, editorial, asymmetric */}
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        {/* subtle abstract treatment — faint grid + radial glow, no cheesy AI */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#050505]" />
          {/* very faint grid */}
          <div className="absolute inset-0 opacity-[0.035]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '72px 72px'
          }} />
          {/* restrained radial lighting — electric blue / violet, extremely subtle */}
          <div className="absolute -top-[28%] left-[42%] w-[860px] h-[680px] rounded-full opacity-[0.09] blur-[1px]" style={{ background: 'radial-gradient(ellipse at center, #6B7CFF 0%, #3A2ADE 28%, transparent 72%)' }} />
          <div className="absolute top-[22%] -right-[10%] w-[560px] h-[560px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(ellipse at center, #FF3B30 0%, transparent 68%)' }} />
          {/* fine flowing line — hairline */}
          <div className="absolute top-[58%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>

        <div className="relative max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10">
          {/* asymmetric grid: text left, upload right */}
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-8 pt-12 sm:pt-16 lg:pt-[72px] pb-10 sm:pb-12 lg:pb-[56px] items-start">
            {/* Left — huge typography */}
            <div className="min-w-0">
              <p className="mono text-[10px] tracking-[0.18em] text-white/40">CONTENT INTELLIGENCE / 01</p>

              <h1 className="mt-6 font-[300] leading-[0.88] tracking-[-0.04em] text-[#F2EFE8]">
                <span className="block text-[44px] sm:text-[58px] lg:text-[78px] xl:text-[86px]">SOCIAL</span>
                <span className="block text-[44px] sm:text-[58px] lg:text-[78px] xl:text-[86px] -mt-1">MEDIA</span>
                <span className="block text-[44px] sm:text-[58px] lg:text-[78px] xl:text-[86px] -mt-1">CONTENT</span>
                <span className="block text-[44px] sm:text-[58px] lg:text-[78px] xl:text-[86px] -mt-1 font-[300] text-white/90">ANALYZER</span>
              </h1>

              <p className="mt-6 max-w-[420px] text-[14px] sm:text-[15px] leading-[1.65] text-white/55">
                Understand how your content is structured, how engaging it is, and what could make it stronger.
              </p>

              {/* mobile upload appears here after hero on small screens — we keep same upload block but hidden on lg */}
              <div className="lg:hidden mt-8">
                {/* upload card duplicated for mobile — rendered once via shared component below, so hide */}
              </div>

              <div className="hidden lg:flex items-center gap-6 mt-10 pt-8 border-t border-white/[0.07] max-w-[520px]">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="mono text-[10px] tracking-[0.14em] text-white/40">PDF · PNG · JPG · JPEG</span>
                </div>
                <span className="mono text-[10px] tracking-[0.14em] text-white/25">MAX 10 MB</span>
              </div>
            </div>

            {/* Right — elegant thin upload area */}
            <div className="lg:pt-2">
              {!uploading ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleBrowse}
                  className={`group relative cursor-pointer border bg-white/[0.015] backdrop-blur-[2px] transition-all duration-300
                    ${dragActive ? 'border-[#6B7CFF]/50 bg-white/[0.04]' : 'border-white/15 hover:border-white/25 hover:bg-white/[0.03]'}
                  `}
                >
                  {/* inner */}
                  <div className="px-7 sm:px-8 py-9 sm:py-10">
                    <div className="flex items-start justify-between gap-4">
                      <p className="mono text-[10px] tracking-[0.18em] text-white/40">DROP YOUR CONTENT</p>
                      <span className="hidden sm:inline mono text-[10px] tracking-[0.12em] text-white/20 border border-white/10 px-2 py-1">01 — UPLOAD</span>
                    </div>

                    <div className="mt-8 flex flex-col items-center text-center">
                      <div className={`w-10 h-10 border flex items-center justify-center transition-colors ${dragActive ? 'border-[#6B7CFF]/40 bg-[#6B7CFF]/10' : 'border-white/12 bg-white/[0.02] group-hover:border-white/20'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={dragActive ? 'text-[#6B7CFF]' : 'text-white/50'}>
                          <path d="M12 16V4M12 4l-5 5M12 4l5 5M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
                        </svg>
                      </div>
                      <p className="mt-5 text-[15px] tracking-[-0.01em] text-white/90">
                        {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                      </p>
                      <p className="mono mt-2 text-[11px] tracking-[0.10em] text-white/35">OR CLICK TO BROWSE</p>

                      <div className="mt-6 flex items-center gap-2 mono text-[10px] tracking-[0.14em] text-white/30">
                        <span>PDF</span><span className="text-white/15">·</span><span>PNG</span><span className="text-white/15">·</span><span>JPG</span><span className="text-white/15">·</span><span>JPEG</span>
                      </div>
                      <p className="mono mt-1 text-[10px] tracking-[0.12em] text-white/25">MAX 10 MB</p>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleBrowse() }}
                        className="mt-7 mono text-[11px] tracking-[0.16em] border border-white/15 px-7 py-[10px] text-white/90 hover:bg-white hover:text-black transition-colors"
                      >
                        CHOOSE FILE
                      </button>
                    </div>
                  </div>

                  {/* bottom hairline accent when drag */}
                  <div className={`h-px bg-gradient-to-r from-transparent via-[#6B7CFF]/60 to-transparent transition-opacity ${dragActive ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              ) : (
                <div className="border border-white/10 bg-white/[0.02] px-7 sm:px-8 py-10">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 border border-white/15 rounded-full border-t-white/80 animate-spin" style={{ borderTopColor: 'rgba(255,255,255,0.9)' }} />
                    <p className="mono mt-5 text-[11px] tracking-[0.16em] text-white/60">PROCESSING — EXTRACTING TEXT</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/40 max-w-[28ch] truncate">{selectedFile?.name}</p>
                    <p className="mono mt-1 text-[10px] tracking-[0.12em] text-white/25">OCR IF REQUIRED · HEURISTIC SCORING</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-3 border border-red-500/20 bg-red-500/[0.06] px-4 py-3 flex gap-3">
                  <span className="mono text-[10px] tracking-[0.12em] text-red-400 mt-0.5">ERROR</span>
                  <p className="text-[13px] leading-relaxed text-red-300/90">{error}</p>
                </div>
              )}

              {/* tiny reassurance */}
              <p className="mono mt-3 text-[10px] leading-relaxed tracking-[0.08em] text-white/20">
                Heuristic content intelligence — no LLM, no external AI API. Text is processed locally via PyMuPDF + Tesseract when needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — editorial, not cards */}
      <section className="border-b border-white/[0.07]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <p className="mono text-[10px] tracking-[0.18em] text-white/35 shrink-0">HOW IT WORKS / 02</p>
            <div className="grid sm:grid-cols-3 gap-8 lg:gap-10 max-w-[760px] w-full">
              {[
                { n: '01', t: 'Validate & extract', d: 'PDF text via PyMuPDF. Scanned PDFs and images via Tesseract OCR.' },
                { n: '02', t: 'Heuristic scoring', d: '9 components — length, hashtags, CTA, hook, readability, formatting, energy, variety.' },
                { n: '03', t: 'Actionable report', d: 'Suitability, score explanations, strengths, improvements, download.' },
              ].map(s => (
                <div key={s.n} className="border-t border-white/10 pt-4">
                  <p className="mono text-[10px] tracking-[0.16em] text-white/25">{s.n}</p>
                  <p className="mt-2 text-[14px] tracking-[-0.01em] text-white/90">{s.t}</p>
                  <p className="mt-2 text-[13px] leading-[1.6] text-white/45">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
