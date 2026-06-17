export const NAVBAR_MENUS = {
  admin: [
    //General
    { label: "Dashboard", path: "/admin/dashboard" },

    "divider",
    // Influencers and creators
    { label: "Influencers", path: "/admin/influencers" },
    { label: "UGC Creators", path: "/admin/ugc-creators" },

    "divider",
    // Clients and sales
    { label: "Quotations", path: "/admin/quotations" },
    { label: "Leads", path: "/admin/leads" },
    { label: "Clients", path: "/admin/clients" },

    "divider",
    // general HR tools
    { label: "Employees", path: "/admin/employees" },
    { label: "Attendance", path: "/admin/attendance" },
    { label: "Tasks", path: "/admin/tasks" },
    { label: "Holidays", path: "/admin/holidays" },
    { label: "Reports", path: "/admin/reports" },
    { label: "Leave Approvals", path: "/admin/leaves" },
  ],

  employee: [
    // General
    { label: "Dashboard", path: "/employee/dashboard" },
    { label: "Attendance", path: "/employee/attendance" },
    { label: "Holidays", path: "/employee/holidays" },
    { label: "To Do List", path: "/employee/todo" },
    { label: "Profile", path: "/employee/profile" },
    { label: "Leaves", path: "/employee/leaves" },
    "divider",
    // Influencers and creators
    { label: "Influencers", path: "/admin/influencers" },
    { label: "UGC Creators", path: "/admin/ugc-creators" },
  ],

  hr: [
    // General
    { label: "Dashboard", path: "/hr/dashboard" },
    { label: "Profile", path: "/hr/profile" },
    { label: "Attendance", path: "/hr/attendance" },
    { label: "Leaves", path: "/hr/leaves" },
    { label: "To Do List", path: "/hr/todo" },
    "divider",
    // Influencers and creators
    { label: "Influencers", path: "/hr/influencers" },
    { label: "UGC Creators", path: "/hr/ugc-creators" },
    "divider",
    // Clients and sales
    { label: "Work Dashboard", path: "/hr/work-dashboard" },
    { label: "Leads", path: "/hr/leads" },
    { label: "Clients", path: "/hr/clients" },
    "divider",
    // general HR tools
    { label: "Mark Attendance", path: "/hr/mark-attendance" },
    { label: "Employees", path: "/hr/employees" },
    { label: "All Tasks", path: "/hr/all-tasks" },
    { label: "Holidays", path: "/hr/hrHoliday" },
    { label: "Reports", path: "/hr/hrReports" },
    { label: "Leave Approvals", path: "/hr/hrLeaveApproval" },
  ],

  intern: [
    // General
    { label: "Dashboard", path: "/employee/dashboard" },
    { label: "Attendance", path: "/employee/attendance" },
    { label: "Holidays", path: "/employee/holidays" },
    { label: "To Do List", path: "/employee/todo" },
    { label: "Profile", path: "/employee/profile" },
    { label: "Leaves", path: "/employee/leaves" },
    "divider",
    // Influencers and creators
    { label: "Influencers", path: "/admin/influencers" },
    { label: "UGC Creators", path: "/admin/ugc-creators" },
  ],
};

export const SECTION_TITLES = {
  admin: ["General", "Creators", "Business", "HR Tools"],
  hr: ["General", "Creators", "Business", "HR Tools"],
  employee: ["General"],
  intern: ["General"],
};
