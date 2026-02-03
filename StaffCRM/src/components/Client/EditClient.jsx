import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getClientById, updateClient } from "../../api/client.api";
import api from "../../api/axios";

import { createClientSchema } from "./validations/client.schema";
import styles from "./CreateClient.module.css";

import BasicInfoSection from "./subcomponents/BasicInfoSection";
import ServicesSection from "./subcomponents/ServicesSection";
import PaymentSection from "./subcomponents/PaymentSection";
import TransactionsTable from "./subcomponents/TransactionsTable";
import CredentialsTable from "./subcomponents/CredentialsTable";

import { useAuth } from "../../context/AuthContext";

const EditClient = () => {
  const { role } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      billingType: "one-time",
      paymentStatus: "pending",
      transactions: [],
      credentials: [],
    },
  });

  const { handleSubmit, register, watch, control, reset } = form;

  /* =========================
     HELPERS
  ========================= */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* =========================
     FETCH CLIENT
  ========================= */
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
          servicesText: c.services.join(", "),
          billingType: c.billingType,
          paymentStatus: c.paymentStatus,
          totalAmount: c.totalAmount,
          monthlyAmount: c.monthlyAmount,
          tenure: c.tenure,
          transactions: c.transactions.map((t) => ({
            ...t,
            date: t.date?.split("T")[0] || "",
          })),
          credentials: c.credentials || [],
        });
      } catch {
        toast.error("Failed to load client");
        navigate(`/${role}/clients`);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate, reset, role]);

  /* =========================
     PROFILE PHOTO (IMMEDIATE)
  ========================= */
  const uploadProfilePhoto = async (file) => {
    try {
      const base64 = await fileToBase64(file);

      await api.post(
        `/clients/${id}/profile-photo`,
        { image: base64 },
        { headers: { "Content-Type": "application/json" } },
      );

      toast.success("Profile photo updated");

      // Update preview instantly
      setClient((prev) => ({
        ...prev,
        profilePhoto: base64,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload profile photo");
    }
  };

  /* =========================
     SUBMIT (DATA ONLY)
  ========================= */
  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const fd = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // SERVICES
        if (key === "servicesText") {
          value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => fd.append("services", s));
          return;
        }

        // ARRAYS / OBJECTS
        if (typeof value === "object") {
          fd.append(key, JSON.stringify(value));
          return;
        }

        // PRIMITIVES
        fd.append(key, value);
      });

      await updateClient(id, fd);

      toast.success("Client updated successfully");
      navigate(`/${role}/clients/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading client...</div>;
  }

  return (
    <div className="masterContainer">
      <div className={styles.container}>
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
              type="button"
              className={styles.submit}
              disabled={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              {submitting ? "Updating..." : "Update Client"}
            </button>
          </div>
        </div>

        <BasicInfoSection
          register={register}
          errors={form.formState.errors}
          existingPhoto={client.profilePhoto}
          onProfileChange={uploadProfilePhoto}
        />

        <ServicesSection register={register} />
        <PaymentSection register={register} watch={watch} />
        <TransactionsTable control={control} register={register} />
        <CredentialsTable control={control} register={register} />
      </div>
    </div>
  );
};

export default EditClient;
