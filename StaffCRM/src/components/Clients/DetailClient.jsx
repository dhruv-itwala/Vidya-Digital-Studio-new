import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";
import toast from "react-hot-toast";
import ClientForm from "./ClientForm";

export default function DetailClient() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await getClientByIdAPI(id);
        setClient(res.data.data);
      } catch (err) {
        toast.error(`Failed to load client: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!client) return <div>Client not found</div>;

  return <ClientForm mode="view" initialData={client} />;
}
