import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { sound } from '../../utils/sound';

interface QRCodeModalProps {
  roomCode: string;
  roomTitle: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  roomCode,
  roomTitle,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}?code=${roomCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      sound.playPop();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">학생 접속 안내</h3>
        <p className="text-xs text-slate-500 mb-6 truncate">{roomTitle}</p>

        {/* QR Code Container */}
        <div className="bg-gradient-to-tr from-indigo-50 to-sky-50 p-6 rounded-2xl border border-indigo-100/60 inline-flex flex-col items-center justify-center shadow-inner mb-6">
          <div className="bg-white p-3 rounded-xl shadow-xs">
            <QRCodeSVG
              value={joinUrl}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-2 font-medium">스마트폰 / 태블릿 카메라로 스캔</span>
        </div>

        {/* Big Room Code */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">접속 코드</p>
          <div className="inline-block px-6 py-2.5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
            <span className="text-3xl font-extrabold font-mono tracking-widest text-indigo-700">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Copy Link Button */}
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>접속 링크 복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>참여 링크 복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
