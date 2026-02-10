import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    code?: string;
    t: any;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title, message, code, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="bg-[#050505] border border-red-500/30 w-full max-w-md rounded-2xl flex flex-col shadow-[0_0_50px_rgba(255,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-red-950/10">
                    <div>
                        <h2 className="text-xl font-bold text-red-500 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6" />
                            {title}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 rounded-full shrink-0">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            {code && (
                                <span className="text-[10px] font-mono text-red-400 border border-red-500/20 px-2 py-0.5 rounded bg-red-950/20">
                                    ERR_CODE: {code}
                                </span>
                            )}
                            <p className="text-gray-300 leading-relaxed text-sm">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-red-500/20 bg-red-950/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-mono font-bold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
                    >
                        {t?.dismiss || "Dismiss"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
