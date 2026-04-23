export const WORK_POLICIES = {
  full_time: {
    weeklyHours: 48,
    dailyHours: 8,

    officeHours: {
      start: 8,
      end: 19,
    },

    attendance: {
      presentMinutes: 420, // 7 hrs (8 hrs - 1 hr break)
      halfDayMinutes: 210, // 3.5 hrs
    },

    maxDailyMinutes: 480,
  },

  intern: {
    weeklyHours: 30,
    dailyHours: 6,

    officeHours: {
      start: 9,
      end: 18,
    },

    attendance: {
      presentMinutes: 300,
      halfDayMinutes: 180,
    },

    maxDailyMinutes: 360,
  },
};

export const ROLE_WORK_POLICY = {
  employee: "full_time",
  hr: "full_time",
  intern: "intern",
};
