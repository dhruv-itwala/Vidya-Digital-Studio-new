// // src/modules/QuoteSystem.js
// import { useState, useCallback } from "react";
// import { toast } from "react-toastify";

// const SPECIAL = ["Content Production", "Content Distribution"];

// export default function useQuoteSystem({ isAdmin = false } = {}) {
//   const [lockedCategory, setLockedCategory] = useState(null);

//   const [client, setClient] = useState({
//     name: "",
//     email: "",
//     contact: "",
//     designation: "",
//     address: "",
//     duration: "",
//   });

//   // VALIDATE category mixing (does NOT append)
//   const validateServiceAdd = useCallback(
//     (item) => {
//       const newCat = item.category;

//       if (!lockedCategory) {
//         // FIRST item → lock category type
//         setLockedCategory(SPECIAL.includes(newCat) ? newCat : "normal");
//         return true;
//       }

//       // RULES
//       if (
//         lockedCategory === "Content Production" &&
//         newCat !== "Content Production"
//       ) {
//         toast.error("Only Content Production allowed.");
//         return false;
//       }

//       if (
//         lockedCategory === "Content Distribution" &&
//         newCat !== "Content Distribution"
//       ) {
//         toast.error("Only Content Distribution allowed.");
//         return false;
//       }

//       if (lockedCategory === "normal" && SPECIAL.includes(newCat)) {
//         toast.error("Cannot mix with CP/CD.");
//         return false;
//       }

//       return true;
//     },
//     [lockedCategory]
//   );

//   const validateClient = () => {
//     if (!client.name.trim()) return toast.error("Name required");

//     if (!/\S+@\S+\.\S+/.test(client.email)) return toast.error("Invalid email");

//     if (!/^[6-9]\d{9}$/.test(client.contact))
//       return toast.error("Invalid phone number");

//     return true;
//   };

//   const reset = () => {
//     setLockedCategory(null);
//     setClient({
//       name: "",
//       email: "",
//       contact: "",
//       designation: "",
//       address: "",
//       duration: "",
//     });
//   };

//   return {
//     client,
//     setClient,
//     validateClient,
//     validateServiceAdd,
//     lockedCategory,
//     reset,
//     isAdmin,
//   };
// }

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
