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

    console.group("🟢 CREATE CLIENT SUBMIT");
    console.log("📄 Raw form data:", data);

    try {
      setLoading(true);

      const fd = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // SERVICES: convert servicesText → services[]
        if (key === "servicesText") {
          const services = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          services.forEach((s) => fd.append("services", s));
          return;
        }

        // PROFILE PHOTO (FILE)
        if (key === "profilePhoto") {
          if (value?.[0]) {
            fd.append("profilePhoto", value[0]);
            console.log("🖼 Profile photo:", value[0]);
          }
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

      console.log("📤 FormData entries:");
      for (const pair of fd.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await createClient(fd);
      console.log("✅ API response:", response);

      toast.success("Client created successfully");
      navigate(`/${role}/clients`);
    } catch (err) {
      console.error("❌ Create client failed:", err);
      toast.error(err.response?.data?.message || "Failed to create client");
    } finally {
      setLoading(false);
      console.groupEnd();
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
        <ServicesSection register={register} />
        <PaymentSection register={register} watch={watch} />
        <TransactionsTable control={control} register={register} />
        <CredentialsTable control={control} register={register} />
      </form>
    </div>
  );
};

export default CreateClient;
