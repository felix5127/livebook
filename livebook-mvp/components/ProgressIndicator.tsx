'use client'

import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getStatusColor, getStatusText } from '@/lib/utils'

interface ProgressIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  showIcon?: boolean
}

export default function ProgressIndicator({ 
  status, 
  message, 
  showIcon = true 
}: ProgressIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5" />
      case 'failed':
        return <XCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const getProgressBar = () => {
    if (status === 'processing') {
      return (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-2">
        {showIcon && getIcon()}
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      </div>
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
      {getProgressBar()}
    </div>
  )
}