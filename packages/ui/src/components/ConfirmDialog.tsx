import { useState } from 'react';
import type { ReactNode } from 'react';
import './styles.css';

export interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({ trigger, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', onConfirm }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="mc-dialog__overlay" role="dialog" aria-modal>
          <div className="mc-dialog">
            <h2>{title}</h2>
            <p>{message}</p>
            <div className="mc-dialog__actions">
              <button type="button" className="mc-button mc-button--ghost" onClick={() => setOpen(false)}>
                {cancelLabel}
              </button>
              <button type="button" className="mc-button" onClick={handleConfirm} disabled={loading}>
                {loading ? '...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
