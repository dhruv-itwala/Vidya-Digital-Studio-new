import { useEffect, useState } from "react";
import { getLeadByIdAPI } from "../../api/leads.api";
import { useParams } from "react-router-dom";
import LeadForm from "./LeadForm";
import Loader from "../Loader/Loader";

export default function EditLead() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);

  useEffect(() => {
    const fetchLead = async () => {
      const res = await getLeadByIdAPI(id);
      setLead(res.data.data);
    };
    fetchLead();
  }, [id]);

  if (!lead) return <Loader />;

  return <LeadForm mode="edit" initialData={lead} />;
}
