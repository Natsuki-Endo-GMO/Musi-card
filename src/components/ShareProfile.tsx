import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  TwitterShareButton,
  FacebookShareButton,
  LineShareButton,
  WhatsappShareButton,
  TwitterIcon,
  FacebookIcon,
  LineIcon,
  WhatsappIcon
} from 'react-share'

interface ShareProfileProps {
  username: string
  displayName: string
  bio: string
  className?: string
}

export default function ShareProfile({ username, displayName, bio, className = '' }: ShareProfileProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  const profileUrl = `${window.location.origin}/users/${username}`
  const shareText = `${displayName}の音楽名刺をチェック！ ${bio ? `"${bio}"` : ''}`

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(profileUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
        setQrCodeUrl(qrDataUrl)
      } catch (error) {
        console.error('QRコード生成エラー:', error)
      }
    }

    generateQR()
  }, [profileUrl])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('クリップボードコピーエラー:', error)
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        プロフィールを共有
      </h3>

      {/* URL共有 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          プロフィールURL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={profileUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {copied ? '✓ コピー済み' : 'コピー'}
          </button>
        </div>
      </div>

      {/* QRコード */}
      <div className="mb-6">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          QRコードを{showQR ? '非表示' : '表示'}
        </button>
        {showQR && qrCodeUrl && (
          <div className="mt-3 text-center">
            <img
              src={qrCodeUrl}
              alt="プロフィールQRコード"
              className="mx-auto border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              スマートフォンでQRコードを読み取ってプロフィールにアクセス
            </p>
          </div>
        )}
      </div>

      {/* ソーシャルシェア */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          SNSで共有
        </label>
        <div className="flex gap-2">
          <TwitterShareButton url={profileUrl} title={shareText}>
            <TwitterIcon size={36} round />
          </TwitterShareButton>
          <FacebookShareButton url={profileUrl} title={shareText}>
            <FacebookIcon size={36} round />
          </FacebookShareButton>
          <LineShareButton url={profileUrl} title={shareText}>
            <LineIcon size={36} round />
          </LineShareButton>
          <WhatsappShareButton url={profileUrl} title={shareText}>
            <WhatsappIcon size={36} round />
          </WhatsappShareButton>
        </div>
      </div>
    </div>
  )
} 