// import React, { useState, useEffect, useCallback } from "react";
// import {
//   BiSearch,
//   BiPlus,
//   BiChevronLeft,
//   BiChevronRight,
// } from "react-icons/bi";
// import toast from "react-hot-toast";
// import {
//   getInfluencersAPI,
//   deleteInfluencerAPI,
// } from "../../api/influencers.api";
// import { CONTENT_TYPES } from "./constants";
// import styles from "./Influencer.module.css";
// import InfluencerCard from "./InfluencerCard";
// import InfluencerForm from "./InfluencerForm";

// export default function InfluencerList() {
//   const [data, setData] = useState([]);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [search, setSearch] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [editItem, setEditItem] = useState(null);

//   const fetchData = async () => {
//     try {
//       const res = await getInfluencersAPI({ page, limit: 9 });
//       setData(res.data.data);
//       setTotalPages(res.data.pages);
//     } catch (err) {
//       toast.error("Failed to load creators");
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [page]);

//   const handleAdd = () => {
//     setEditItem(null);
//     setDrawerOpen(true);
//   };

//   const handleEdit = (item) => {
//     setEditItem(item);
//     setDrawerOpen(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure?")) {
//       await deleteInfluencerAPI(id);
//       toast.success("Influencer removed");
//       fetchData();
//     }
//   };

//   const filtered = data.filter((d) => {
//     const matchType =
//       filterType === "all" || d.contentTypes?.includes(filterType);
//     const q = search.toLowerCase();
//     const matchSearch = !q || d.name?.toLowerCase().includes(q);
//     return matchType && matchSearch;
//   });

//   return (
//     <div className="masterContainer">
//       <div className={styles.container}>
//         <div className={styles.header}>
//           <h2>
//             Influencers <br />
//             <span className={styles.totalCount}>{data.length} Total </span>
//           </h2>
//           <div className={styles.actions}>
//             <div className={styles.searchWrapper}>
//               <BiSearch className={styles.searchIcon} />
//               <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search..."
//                 className={styles.searchInput}
//               />
//             </div>
//             <button onClick={handleAdd} className={styles.addButton}>
//               <BiPlus /> Add Influencer
//             </button>
//           </div>
//         </div>

//         <div className={styles.filterRow}>
//           {["all", ...CONTENT_TYPES].map((f) => (
//             <button
//               key={f}
//               onClick={() => {
//                 setFilterType(f);
//                 setPage(1);
//               }}
//               className={`${styles.filterPill} ${filterType === f ? styles.filterPillActive : ""}`}
//             >
//               {f === "all" ? "All" : f.replace("_", " ")}
//             </button>
//           ))}
//         </div>

//         <div className={styles.grid}>
//           {filtered.map((item) => (
//             <InfluencerCard
//               key={item._id}
//               item={item}
//               onEdit={handleEdit}
//               onDelete={handleDelete}
//             />
//           ))}
//         </div>

//         <div className={styles.pagination}>
//           <button
//             disabled={page === 1}
//             onClick={() => setPage((p) => p - 1)}
//             className={styles.pageBtn}
//           >
//             <BiChevronLeft />
//           </button>
//           <span>
//             {page} / {totalPages}
//           </span>
//           <button
//             disabled={page === totalPages}
//             onClick={() => setPage((p) => p + 1)}
//             className={styles.pageBtn}
//           >
//             <BiChevronRight />
//           </button>
//         </div>

//         <InfluencerForm
//           open={drawerOpen}
//           editItem={editItem}
//           onClose={() => setDrawerOpen(false)}
//           onSaved={fetchData}
//         />
//       </div>
//     </div>
//   );
// }

import React from "react";
import Maintenance from "../Maintenance/Maintenance";

const InfluencerList = () => {
  return (
    <div>
      <Maintenance />
    </div>
  );
};

export default InfluencerList;
