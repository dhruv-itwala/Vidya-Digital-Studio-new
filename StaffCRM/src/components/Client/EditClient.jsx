import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getClientById, updateClient } from "../../api/client.api";
import { createClientSchema } from "./validations/client.schema";
import styles from "./CreateClient.module.css";

import BasicInfoSection from "./subcomponents/BasicInfoSection";
import ServicesSection from "./subcomponents/ServicesSection";
import PaymentSection from "./subcomponents/PaymentSection";
import TransactionsTable from "./subcomponents/TransactionsTable";
import DocumentsTable from "./subcomponents/DocumentsTable";
import CredentialsTable from "./subcomponents/CredentialsTable";
import { useAuth } from "../../context/AuthContext";

const EditClient = () => {
  const { role } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);

  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      billingType: "one-time",
      paymentStatus: "pending",
      transactions: [],
      documents: [],
      credentials: [],
    },
  });

  const { handleSubmit, register, watch, control, reset } = form;

  /* =========================
     FETCH CLIENT
  ========================= */
  const fetchClient = async () => {
    try {
      const res = await getClientById(id);
      const clientData = res.data;

      setClient(clientData); // ✅ STORE CLIENT

      reset({
        clientName: clientData.clientName,
        ownerName: clientData.ownerName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        onboardingDate: clientData.onboardingDate?.split("T")[0],

        servicesText: clientData.services.join(", "),

        billingType: clientData.billingType,
        paymentStatus: clientData.paymentStatus,

        totalAmount: clientData.totalAmount,
        monthlyAmount: clientData.monthlyAmount,
        tenure: clientData.tenure,

        // ✅ FIX DATE FORMAT HERE TOO
        transactions: clientData.transactions.map((t) => ({
          ...t,
          date: t.date ? t.date.split("T")[0] : "",
        })),

        credentials: clientData.credentials || [],
        documents: clientData.documents.map((doc) => ({
          _id: doc._id, // IMPORTANT
          name: doc.name,
          url: doc.url,
          file: null, // replacement file
          existing: true,
          removed: false,
        })),
      });
    } catch {
      toast.error("Failed to load client");
      navigate(`/${role}/clients`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  /* =========================
     SUBMIT
  ========================= */
  const onSubmit = async (data) => {
    try {
      const fd = new FormData();

      Object.entries(data).forEach(([key, val]) => {
        if (val === undefined || val === null) return;

        // SERVICES
        if (key === "servicesText") {
          val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => fd.append("services[]", s));
          return;
        }

        if (key === "documents") {
          const keepDocs = [];
          const replaceDocs = [];
          const newDocs = [];

          val.forEach((doc) => {
            if (doc.removed) return;

            // EXISTING DOC
            if (doc.existing) {
              keepDocs.push({
                _id: doc._id,
                name: doc.name,
              });

              // replacement file
              if (doc.file?.[0]) {
                replaceDocs.push({
                  _id: doc._id,
                  name: doc.name,
                });
                fd.append("documents", doc.file[0]);
              }
            }

            // NEW DOC
            if (!doc.existing && doc.file?.[0]) {
              newDocs.push({ name: doc.name });
              fd.append("documents", doc.file[0]);
            }
          });

          fd.append("keepDocuments", JSON.stringify(keepDocs));
          fd.append("replaceDocuments", JSON.stringify(replaceDocs));
          fd.append("newDocuments", JSON.stringify(newDocs));

          return;
        }

        // PROFILE PHOTO
        if (key === "profilePhoto") {
          if (val?.[0]) fd.append("profilePhoto", val[0]);
          return;
        }

        // ARRAYS / OBJECTS
        if (typeof val === "object") {
          fd.append(key, JSON.stringify(val));
          return;
        }

        // PRIMITIVES
        fd.append(key, val);
      });

      await updateClient(id, fd);
      toast.success("Client updated successfully");
      navigate(`/admin/clients/${id}`);
    } catch {
      toast.error("Failed to update client");
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading client...</div>;
  }

  return (
    <div className="masterContainer">
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Edit Client</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate("/admin/clients")}
            >
              Back
            </button>
            <button className={styles.submit}>Update Client</button>
          </div>
        </div>
        <BasicInfoSection
          register={register}
          errors={form.formState.errors}
          existingPhoto={client.profilePhoto}
        />
        <ServicesSection register={register} />
        <PaymentSection register={register} watch={watch} />
        <TransactionsTable control={control} register={register} />
        <DocumentsTable control={control} register={register} />
        <CredentialsTable control={control} register={register} />
      </form>
    </div>
  );
};

export default EditClient;
