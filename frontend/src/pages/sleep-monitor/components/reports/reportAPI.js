import API from "../../../../services/api";

export const fetchWeeklyReport = async () => {
  const res = await API.get("/report/weekly");
  return res.data;
};