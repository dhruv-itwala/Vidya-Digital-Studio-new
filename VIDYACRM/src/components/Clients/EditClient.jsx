import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";
import toast from "react-hot-toast";
import ClientForm from "./ClientForm";
import Loader from "../Loader/Loader";

export default function EditClient() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await getClientByIdAPI(id);
        setClient(res.data.data);
      } catch {
        toast.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) return <Loader />;
  if (!client) return <div>Client not found</div>;

  return <ClientForm mode="edit" initialData={client} />;
}
