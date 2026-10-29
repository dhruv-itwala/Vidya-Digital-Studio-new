import React from "react";
import { useParams } from "react-router-dom";
import ContentCalendarManager from "../../components/Clients/components/ContentCalendarManager";

export default function ClientCalendar() {
  const { id: clientId } = useParams();

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <ContentCalendarManager clientId={clientId} readOnly={true} />
    </div>
  );
}
