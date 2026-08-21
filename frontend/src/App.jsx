import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import AnalysisResults from './components/AnalysisResults'

export default function App() {
  const [result, setResult] = useState(null)
  const [view, setView] = useState('upload')

  const handleFileResult = useCallback((data) => {
    setResult(data)
    setView('analysis')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleReset = useCallback(() => {
    setResult(null)
    setView('upload')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const showAnalysis = view === 'analysis' && result && result.analysis

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAE6DF] flex flex-col">
      {/* Premium thin header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#050505]/85 backdrop-blur-[12px]">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 h-[56px] flex items-center justify-between gap-8">
          {/* Left: refined mark */}
          <button onClick={handleReset} className="flex items-center gap-3 group shrink-0">
            <div className="w-[28px] h-[28px] border border-white/15 flex items-center justify-center">
              <span className="mono text-[10px] leading-none tracking-[0.14em] text-white/90">SCA</span>
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="mono text-[10px] tracking-[0.14em] text-white/90">SOCIAL MEDIA</p>
              <p className="mono text-[10px] tracking-[0.14em] text-white/90">CONTENT ANALYZER</p>
            </div>
            <span className="sm:hidden mono text-[11px] tracking-[0.14em] text-white/90">SCA</span>
          </button>

          {/* Center nav — editorial, no fake pages */}
          <nav className="hidden md:flex items-center gap-7">
            <button onClick={handleReset} className="mono text-[10px] tracking-[0.16em] text-white/45 hover:text-white/90 transition-colors">HOW IT WORKS</button>
            <button
              onClick={() => showAnalysis && setView('analysis')}
              className={`mono text-[10px] tracking-[0.16em] transition-colors ${showAnalysis ? 'text-white/90' : 'text-white/25 cursor-default'}`}
            >
              ANALYSIS
            </button>
            <a href="#footer" className="mono text-[10px] tracking-[0.16em] text-white/45 hover:text-white/90 transition-colors">ABOUT</a>
          </nav>

          {/* Right: new upload */}
          <div className="flex items-center gap-4 shrink-0">
            {showAnalysis ? (
              <button
                onClick={handleReset}
                className="mono text-[10px] tracking-[0.16em] border border-white/15 px-4 py-[7px] hover:bg-white hover:text-black transition-colors"
              >
                NEW UPLOAD
              </button>
            ) : (
              <span className="hidden sm:inline mono text-[10px] tracking-[0.14em] text-white/30">HEURISTIC / RULE-BASED</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {showAnalysis ? (
          <AnalysisResults result={result} onReset={handleReset} />
        ) : (
          <FileUpload onFileValidated={handleFileResult} />
        )}
      </main>

      <footer id="footer" className="border-t border-white/[0.07] mt-auto">
        <div className="max-w-[1480px] mx-auto px-6 sm:px-8 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="mono text-[10px] tracking-[0.12em] text-white/30">HEURISTIC ANALYSIS — NOT A SCIENTIFIC PREDICTION · FASTAPI + REACT</p>
          <p className="mono text-[10px] tracking-[0.12em] text-white/25">© 2026 · SOCIAL MEDIA CONTENT ANALYZER</p>
        </div>
      </footer>
    </div>
  )
}
