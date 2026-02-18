import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getClientById } from "../../api/client.api";
import { useClient } from "../../hooks/useClient";

import styles from "./CreateClient.module.css";

import BasicInfoSection from "./subcomponents/BasicInfoSection";
import ServicesSection from "./subcomponents/ServicesSection";
import PaymentSection from "./subcomponents/PaymentSection";
import TransactionsTable from "./subcomponents/TransactionsTable";
import CredentialsTable from "./subcomponents/CredentialsTable";
import DocumentsTable from "./subcomponents/DocumentsTable";

import { useAuth } from "../../context/AuthContext";

const EditClient = () => {
  const { role } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    loading: submitting,
    handleUpdateClient,
    handleDeleteDocument,
  } = useClient();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    defaultValues: {
      billingType: "one-time",
      paymentStatus: "pending",
      transactions: [],
      credentials: [],
      documents: [],
    },
  });

  const {
    handleSubmit,
    register,
    watch,
    control,
    reset,
    setValue,
    formState: { errors },
  } = form;

  /* =========================================
     FETCH CLIENT
  ========================================= */
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await getClientById(id);
        const c = res.data;

        setClient(c);

        reset({
          clientName: c.clientName,
          ownerName: c.ownerName,
          email: c.email,
          phone: c.phone,
          address: c.address,
          onboardingDate: c.onboardingDate?.split("T")[0],
          servicesText: c.services?.join(", "),
          billingType: c.billingType,
          paymentStatus: c.paymentStatus,
          totalAmount: c.totalAmount,
          monthlyAmount: c.monthlyAmount,
          tenure: c.tenure,
          transactions:
            c.transactions?.map((t) => ({
              ...t,
              date: t.date?.split("T")[0] || "",
            })) || [],
          credentials: c.credentials || [],
        });
      } catch (err) {
        toast.error("Failed to load client");
        navigate(`/${role}/clients`);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate, reset, role]);

  /* =========================================
     SUBMIT UPDATE
  ========================================= */
  const onSubmit = async (data) => {
    try {
      await handleUpdateClient(id, data);
      navigate(`/${role}/clients/${id}`);
    } catch (err) {
      console.error(err);
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
              onClick={() => navigate(`/${role}/clients`)}
              disabled={submitting}
            >
              Back
            </button>

            <button
              type="submit"
              className={styles.submit}
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Client"}
            </button>
          </div>
        </div>

        {/* SECTIONS */}

        <BasicInfoSection
          register={register}
          errors={errors}
          existingPhoto={client?.profilePhoto}
        />

        <ServicesSection
          register={register}
          errors={errors}
          existingServices={client?.services}
          setValue={setValue}
        />

        <PaymentSection
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />

        <TransactionsTable
          control={control}
          register={register}
          errors={errors}
        />

        <DocumentsTable
          control={control}
          loading={submitting}
          register={register}
          errors={errors}
          existingDocuments={client?.documents}
          onDeleteExisting={async (docId) => {
            try {
              const deletedId = await handleDeleteDocument(id, docId);

              setClient((prev) => ({
                ...prev,
                documents: prev.documents.filter((d) => d._id !== deletedId),
              }));
            } catch (err) {
              console.error(err);
            }
          }}
        />

        <CredentialsTable
          control={control}
          register={register}
          errors={errors}
        />
      </form>
    </div>
  );
};

export default EditClient;
