import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "../../api/client.api";
import { createClientSchema } from "./validations/client.schema";
import BasicInfoSection from "./subcomponents/BasicInfoSection";
import ServicesSection from "./subcomponents/ServicesSection";
import PaymentSection from "./subcomponents/PaymentSection";
import TransactionsTable from "./subcomponents/TransactionsTable";
import CredentialsTable from "./subcomponents/CredentialsTable";
import { useNavigate } from "react-router-dom";
import styles from "./CreateClient.module.css";
import { useAuth } from "../../context/AuthContext";
import DocumentsTable from "./subcomponents/DocumentsTable";

const CreateClient = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      billingType: "one-time",
      paymentStatus: "pending",
      transactions: [],
      credentials: [],
    },
  });

  const navigate = useNavigate();
  const { handleSubmit, register, watch, control } = form;

  const onSubmit = async (data) => {
    if (loading) return;

    try {
      setLoading(true);

      const fd = new FormData();

      // Handle servicesText separately
      if (data.servicesText) {
        const services = data.servicesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        fd.append("services", JSON.stringify(services));
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === "servicesText") return;

        if (Array.isArray(value)) {
          fd.append(key, JSON.stringify(value));
          return;
        }

        if (key === "profilePhoto" && value?.[0]) {
          fd.append("profilePhoto", value[0]);
          return;
        }

        fd.append(key, value);
      });

      await createClient(fd);

      toast.success("Client created successfully");
      navigate(`/${role}/clients`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="masterContainer">
      <form
        className={styles.container}
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("❌ FORM VALIDATION ERRORS:", errors);
          toast.error("Please fix validation errors");
        })}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Create Client</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate("/admin/clients")}
              disabled={loading}
            >
              Back
            </button>
            <button type="submit" className={styles.submit} disabled={loading}>
              Create Client
            </button>
          </div>
        </div>

        <BasicInfoSection register={register} errors={form.formState.errors} />
        <ServicesSection register={register} errors={form.formState.errors} />

        <PaymentSection
          register={register}
          watch={watch}
          errors={form.formState.errors}
        />

        <TransactionsTable
          control={control}
          register={register}
          errors={form.formState.errors}
        />

        {/* <DocumentsTable
          control={control}
          register={register}
          errors={form.formState.errors}
        /> */}

        <CredentialsTable
          control={control}
          register={register}
          errors={form.formState.errors}
        />
      </form>
    </div>
  );
};

export default CreateClient;
