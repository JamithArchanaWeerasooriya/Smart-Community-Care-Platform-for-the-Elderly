export const getSleepTips = async (req, res) => {
  const session = await SleepSession.findOne().sort({ createdAt: -1 });
  const tips = [];

  if (!session) return res.json({ tips: [] });

  const hours = (session.totalSleepDuration || 0) / 3600;

  if (hours < 6) tips.push({ type: 'alert', title: 'Very short sleep', body: `You only slept ${hours.toFixed(1)}h. Aim for 7–8h.` });
  else if (hours < 7) tips.push({ type: 'warn', title: 'Short sleep', body: `${hours.toFixed(1)}h detected. Try going to bed 45 min earlier.` });

  if (session.snoreFrequency > 15)
    tips.push({ type: 'alert', title: 'High snoring detected', body: 'You had heavy snoring. Consider side sleeping. See a doctor if persistent.' });
  else if (session.snoreFrequency > 5)
    tips.push({ type: 'warn', title: 'Moderate snoring', body: 'Avoid alcohol before bed and sleep on your side.' });

  if (session.factors?.alcohol) tips.push({ type: 'warn', title: 'Alcohol detected', body: 'Alcohol reduces REM sleep quality. Avoid within 3h of bedtime.' });
  if (session.factors?.coffee) tips.push({ type: 'warn', title: 'Caffeine logged', body: 'Caffeine stays in your system 6h+. Cut off by 2 PM.' });
  if (session.factors?.stress) tips.push({ type: 'alert', title: 'Stress flagged', body: 'Try 5 min of box breathing before bed to calm your nervous system.' });

  res.json({ tips, sleepScore: session.sleepScore, snoreLevel: session.snoreLevel, duration: hours });
};