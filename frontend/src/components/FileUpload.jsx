import { useState, useRef, useCallback } from 'react'

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function getFileExtension(name) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.substring(idx).toLowerCase() : ''
}

function validateFile(file) {
  const ext = getFileExtension(file.name)
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type "${ext}". Accepted: PDF, PNG, JPG, JPEG.`
  }
  if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') {
    return `Invalid file type. Accepted: PDF, PNG, JPG, JPEG.`
  }
  if (file.size === 0) {
    return 'File is empty. Please upload a valid file.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File too large (${formatFileSize(file.size)}). Maximum size is 10 MB.`
  }
  return null
}

function getStatusLabel(uploading, result) {
  if (uploading) return 'Uploading...'
  return null
}

function getExtractionLabel(result) {
  if (!result) return null
  switch (result.extraction_method) {
    case 'pdf_ocr': return 'Extracted via OCR (scanned PDF)'
    case 'image_ocr': return 'Extracted via OCR (image)'
    case 'pdf_text': return 'Extracted from PDF text'
    default: return 'Extraction complete'
  }
}

export default function FileUpload({ onFileValidated }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const inputRef = useRef(null)

  const reset = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    setUploading(false)
    setUploadResult(null)
    if (inputRef.current) inputRef.current.value = ''
    if (onFileValidated) onFileValidated(null)
  }, [onFileValidated])

  const processFile = useCallback(async (file) => {
    setError(null)
    setUploadResult(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const message = data.detail?.message || data.detail || 'Upload failed.'
        setError(typeof message === 'string' ? message : 'Upload failed.')
        setUploading(false)
        return
      }

      setUploadResult(data)
      setUploading(false)
      if (onFileValidated) onFileValidated(data)
    } catch {
      setError('Network error. Please check if the server is running.')
      setUploading(false)
    }
  }, [onFileValidated])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }, [processFile])

  const handleChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }, [processFile])

  const handleBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const statusLabel = getStatusLabel(uploading, uploadResult)

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleChange}
        className="hidden"
      />

      {!selectedFile && !uploadResult && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleBrowse}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center
            transition-all duration-200
            ${dragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            <svg
              className={`w-12 h-12 transition-colors ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">
              Drop your PDF or image here
            </p>
            <p className="text-sm text-gray-500">
              PDF, PNG, JPG or JPEG &bull; Max 10 MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowse()
              }}
              className="mt-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Browse files
            </button>
          </div>
        </div>
      )}

      {statusLabel && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-blue-700 font-medium">{statusLabel}</span>
        </div>
      )}

      {uploadResult && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${uploadResult.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${uploadResult.success ? 'bg-green-100' : 'bg-amber-100'}`}>
                {uploadResult.success ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${uploadResult.success ? 'text-green-800' : 'text-amber-800'}`}>
                  {uploadResult.message}
                </p>
                <p className={`text-xs mt-1 ${uploadResult.success ? 'text-green-600' : 'text-amber-600'}`}>
                  {uploadResult.filename} &bull; {formatFileSize(uploadResult.file_size)} &bull; {uploadResult.file_type.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors ${uploadResult.success ? 'text-green-700 hover:text-green-900 hover:bg-green-100' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'}`}
              >
                Upload another
              </button>
            </div>
          </div>

          {uploadResult.success && uploadResult.extracted_text && (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Extracted Text</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{getExtractionLabel(uploadResult)}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {uploadResult.page_count > 0 && (
                    <span>{uploadResult.page_count} page{uploadResult.page_count !== 1 ? 's' : ''}</span>
                  )}
                  <span>{uploadResult.character_count.toLocaleString()} chars</span>
                  <span>{uploadResult.word_count.toLocaleString()} words</span>
                </div>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {uploadResult.extracted_text}
                </pre>
              </div>
            </div>
          )}

          {uploadResult.success && !uploadResult.extracted_text && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
              <p className="text-sm text-amber-700">No readable text could be extracted from this file.</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
