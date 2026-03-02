import { Modal } from "antd";
import "../styles/confirmation-modal.scss";
import DiffTable from "./diff-table";

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  confirmText?: string;
  onConfirm: () => void;
  data?: any[];
}

export default function ConfirmationModal({
  visible,
  onClose,
  confirmText,
  onConfirm,
  data,
}: ConfirmModalProps) {
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

      <DiffTable diff={data} />

      <div className="button-container">
        <button className="confirm-btn" onClick={onConfirm}>
          OK
        </button>
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
