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
import DocumentsTable from "./subcomponents/DocumentsTable";
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
      documents: [],
      credentials: [],
    },
  });
  const navigate = useNavigate();
  const { handleSubmit, register, watch, control } = form;

  // const onSubmit = async (data) => {
  //   console.log("SUBMIT DATA", data);

  //   const fd = new FormData();

  //   Object.entries(data).forEach(([key, val]) => {
  //     if (val === undefined || val === null) return;

  //     // SERVICES (comma separated → array)
  //     if (key === "servicesText") {
  //       val
  //         .split(",")
  //         .map((s) => s.trim())
  //         .filter(Boolean)
  //         .forEach((s) => fd.append("services[]", s));
  //       return;
  //     }

  //     // DOCUMENTS
  //     if (key === "documents") {
  //       const meta = [];
  //       val.forEach((d) => {
  //         if (!d?.file?.[0]) return;
  //         meta.push({ name: d.name });
  //         fd.append("documents", d.file[0]);
  //       });
  //       if (meta.length) {
  //         fd.append("documentsMeta", JSON.stringify(meta));
  //       }
  //       return;
  //     }

  //     // PROFILE PHOTO
  //     if (key === "profilePhoto") {
  //       if (val?.[0]) fd.append("profilePhoto", val[0]);
  //       return;
  //     }

  //     // ARRAYS / OBJECTS (transactions, credentials)
  //     if (typeof val === "object") {
  //       fd.append(key, JSON.stringify(val));
  //       return;
  //     }

  //     // ✅ PRIMITIVES (VERY IMPORTANT)
  //     fd.append(key, val);
  //   });

  //   await createClient(fd);
  //   alert("Client Created");
  // };
  const onSubmit = async (data) => {
    if (loading) return;

    try {
      setLoading(true);

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

        // DOCUMENTS
        if (key === "documents") {
          const meta = [];
          val.forEach((d) => {
            if (!d?.file?.[0]) return;
            meta.push({ name: d.name });
            fd.append("documents", d.file[0]);
          });
          if (meta.length) {
            fd.append("documentsMeta", JSON.stringify(meta));
          }
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

      await createClient(fd);

      toast.success("Client created successfully");
      navigate(`/${role}/clients`);
    } catch (err) {
      toast.error("Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="masterContainer">
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
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
        <DocumentsTable control={control} register={register} />
        <CredentialsTable control={control} register={register} />
      </form>
    </div>
  );
};

export default CreateClient;
