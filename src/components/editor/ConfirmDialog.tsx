import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  position?: {
    x: number;
    y: number;
  };
}

export const ConfirmDialog = ({ isOpen, onConfirm, onCancel, position }: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64"
      style={{
        top: position?.y ?? 0,
        left: position?.x ?? 0,
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900">确认下载</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">是否确定下载文档？</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 text-sm text-white bg-black hover:bg-gray-900 rounded transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
}; 