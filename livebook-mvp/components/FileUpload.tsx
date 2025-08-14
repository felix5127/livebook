'use client'

import { useState } from 'react'
import { Upload, FileAudio, X } from 'lucide-react'
import { validateAudioFile, formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

export default function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>('')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError('')

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileValidation(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const files = e.target.files
    if (files && files[0]) {
      handleFileValidation(files[0])
    }
  }

  const handleFileValidation = (file: File) => {
    const validation = validateAudioFile(file)
    if (validation.valid) {
      onFileSelect(file)
    } else {
      setError(validation.error!)
      onFileSelect(null)
    }
  }

  const removeFile = () => {
    onFileSelect(null)
    setError('')
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <Upload className={`w-16 h-16 mx-auto mb-4 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              拖拽音频文件到这里，或点击选择文件
            </h3>
            <p className="text-gray-500 mb-6">
              支持 MP3, WAV, M4A 格式，最大 100MB
            </p>
            {error && (
              <p className="text-red-600 mb-4 text-sm">{error}</p>
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              选择文件
            </label>
          </>
        ) : (
          <div className="space-y-4">
            <FileAudio className="w-16 h-16 text-blue-500 mx-auto" />
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold text-gray-700">
                {selectedFile.name}
              </h3>
              <button
                onClick={removeFile}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-gray-500 space-y-1">
              <p>文件大小: {formatFileSize(selectedFile.size)}</p>
              <p>文件类型: {selectedFile.type}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}