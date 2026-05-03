export const calculateRisk = (
  breathing,
  cough,
  sleep_yelling,
  sneezing,
  snoring,
  totalChunks
) => {

  const score =
    (
      breathing * 5 +
      snoring * 3 +
      cough * 2 +
      sleep_yelling * 4 +
      sneezing * 1
    ) / totalChunks * 100;

  if (score < 10) return "Excellent";
  if (score < 20) return "Good";
  if (score < 35) return "Disturbed";
  return "Poor";
};