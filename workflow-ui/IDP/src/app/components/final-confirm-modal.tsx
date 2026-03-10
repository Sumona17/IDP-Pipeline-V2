import { Modal } from "antd";
import "../styles/confirmation-modal.scss";
import React, { useState } from "react";
import DocumentViewer from "./DocumentViewer";

interface FinalConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data?: any[];
}

export default function FinalConfirmModal({
  visible,
  onClose,
  onConfirm,
  data,
}: FinalConfirmModalProps) {
  const [showJson, setShowJson] = useState(false);

  const handleShowJson = () => {
    setShowJson((prev) => !prev);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      className="final-confirm-modal"
    >
      <div className="button-container">
        <strong className="confirm-text">
          Your document has been submitted successfully. Click on the button to
          view the final output
        </strong>
      </div>
      <div className="button-container mt-2 mb-2">
        <button className="confirm-btn" onClick={handleShowJson}>
          {showJson ? "Hide Final Output" : "View Final Output"}
        </button>
      </div>
      {showJson && <DocumentViewer data={data?.[0]} />}
      {showJson && (
        <button className="confirm-btn mt-3" onClick={onConfirm}>
          OK
        </button>
      )}
    </Modal>
  );
}
