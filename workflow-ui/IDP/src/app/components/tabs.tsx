import uploadactive from "../../../public/assets/icons/uploadeddoc-act.png";
import upload from "../../../public/assets/icons/uploadeddoc-reg.png";
import DocumentUploaded from "../pages/document/document";

export const tabs = [
  {
    icon: <img src={upload} />,
    iconActive: <img src={uploadactive} />,
    label: "Uploaded Documents",
    content: <DocumentUploaded />,
  },
];
