// src/modules/QuoteSystem.js
import { useState, useCallback } from "react";
import { toast } from "react-toastify";

export default function useQuoteSystem({ isAdmin = false } = {}) {
  const [client, setClient] = useState({
    name: "",
    email: "",
    contact: "",
    designation: "",
    address: "",
    duration: "",
  });

  // VALIDATION WITHOUT CATEGORY RULES
  const validateServiceAdd = useCallback((item) => {
    // Always allow adding any category
    return true;
  }, []);

  const validateClient = () => {
    if (!client.name.trim()) return toast.error("Name required");

    if (!/\S+@\S+\.\S+/.test(client.email)) return toast.error("Invalid email");

    if (!/^[6-9]\d{9}$/.test(client.contact))
      return toast.error("Invalid phone number");

    return true;
  };

  const reset = () => {
    setClient({
      name: "",
      email: "",
      contact: "",
      designation: "",
      address: "",
      duration: "",
    });
  };

  return {
    client,
    setClient,
    validateClient,
    validateServiceAdd,
    reset,
    isAdmin,
  };
}
