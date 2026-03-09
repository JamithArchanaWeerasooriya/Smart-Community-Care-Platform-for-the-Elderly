import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const EMOTION_META = {
  happy:    { color:'#0f9f74', textColor:'#0e5f4a', icon:'sentiment_very_satisfied', label:'Happy' },
  neutral:  { color:'#176b87', textColor:'#134e63', icon:'sentiment_neutral',         label:'Neutral' },
  sad:      { color:'#5a6b9f', textColor:'#3a4580', icon:'sentiment_dissatisfied',    label:'Sad' },
  angry:    { color:'#df5a6a', textColor:'#b42943', icon:'sentiment_very_dissatisfied', label:'Angry' },
  fear:     { color:'#9b5de5', textColor:'#6b2db5', icon:'visibility_off',            label:'Fear' },
  disgust:  { color:'#6a8f3c', textColor:'#3d5c17', icon:'sick',                      label:'Disgust' },
  surprise: { color:'#f28c28', textColor:'#8e4d0d', icon:'celebration',               label:'Surprise' },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background:'rgba(255,255,255,0.96)', border:`1px solid ${d.payload.fill}33`,
      borderRadius:14, padding:'10px 14px', fontFamily:'Outfit,sans-serif',
      boxShadow:'0 8px 24px -8px rgba(15,23,42,0.18)'
    }}>
      <div style={{ fontSize:15, color:d.payload.fill, fontWeight:800 }}>{d.name}</div>
      <div style={{ fontSize:12, color:'#5a6b7f', marginTop:2 }}>{d.value}% of session</div>
    </div>
  );
};

const renderLegend = ({ payload }) => (
  <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginTop:12 }}>
    {payload.map((entry) => (
      <div key={entry.value} style={{
        display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
        borderRadius:999, background:'rgba(255,255,255,0.82)',
        border:'1px solid rgba(148,163,184,0.24)', fontFamily:'Outfit,sans-serif'
      }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:entry.color, flexShrink:0 }} />
        <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#5a6b7f' }}>{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function EmotionDistribution({ history, total }) {
  const counts = {};
  history.forEach(r => { counts[r.emotion] = (counts[r.emotion] || 0) + 1; });
  const data = Object.entries(counts).map(([emotion, count]) => ({
    name: EMOTION_META[emotion]?.label || emotion,
    value: Math.round((count / total) * 100),
    fill: EMOTION_META[emotion]?.color || '#176b87',
  }));

  return (
    <div style={{ width:'100%', padding:'8px 0' }}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name"
            cx="50%" cy="45%" innerRadius={70} outerRadius={110} paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} opacity={0.88} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
