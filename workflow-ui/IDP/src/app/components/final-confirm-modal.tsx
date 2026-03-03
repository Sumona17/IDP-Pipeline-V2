import { Modal } from "antd";
import "../styles/confirmation-modal.scss";

interface FinalConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  confirmText?: string;
  onConfirm: () => void;
  data?: any[];
}

export default function FinalConfirmModal({
  visible,
  onClose,
  confirmText,
  onConfirm,
  data,
}: FinalConfirmModalProps) {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      className="confirm-modal"
    >
      <strong className="confirm-text">{confirmText}</strong>
      <div className="scrollable-div">
        <div className="rounded-md border border-slate-200 bg-slate-50 mb-3">
          <pre className="text-xs overflow-x-auto text-slate-700 px-3 py-3">
            {JSON.stringify(data?.[0])}
          </pre>
        </div>
      </div>
      <button className="confirm-btn" onClick={onConfirm}>
        OK
      </button>
    </Modal>
  );
}
