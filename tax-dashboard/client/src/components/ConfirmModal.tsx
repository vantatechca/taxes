interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-yellow-600 hover:bg-yellow-700',
  info: 'bg-blue-600 hover:bg-blue-700',
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white text-sm rounded-lg ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
