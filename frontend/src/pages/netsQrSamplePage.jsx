import React from "react";
import { useLocation } from 'react-router-dom';
import NetsQrSampleLayout from "./netsQrSampleLayout";

const NetsQrSamplePage = () => {
  const location = useLocation();
  // Pass navigation state into the class-based layout via props
  return <NetsQrSampleLayout navState={location.state} />;
};

export default NetsQrSamplePage;