import FileUpload from './components/FileUpload'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <h1 className="text-xl font-semibold text-gray-900">
            Social Media Content Analyzer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a document to analyze and improve your social media content.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <FileUpload />
      </main>
    </div>
  )
}

export default App
