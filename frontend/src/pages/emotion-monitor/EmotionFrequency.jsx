import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(255,255,255,0.96)', border:`1px solid ${payload[0]?.fill}33`,
      borderRadius:14, padding:'10px 14px', fontFamily:'Outfit,sans-serif',
      boxShadow:'0 8px 24px -8px rgba(15,23,42,0.18)'
    }}>
      <div style={{ fontSize:15, color: payload[0]?.fill, fontWeight:800, textTransform:'capitalize' }}>{label}</div>
      <div style={{ fontSize:12, color:'#5a6b7f', marginTop:2 }}>{payload[0]?.value} readings</div>
    </div>
  );
};

export default function EmotionFrequency({ freqData, total }) {
  return (
    <div style={{ width:'100%', padding:'8px 0' }}>
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={freqData} margin={{ top:10, right:16, left:-10, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize:11, fill:'#8a98a6', fontFamily:'Outfit,sans-serif', fontWeight:700 }}
            tickLine={false} axisLine={{ stroke:'rgba(148,163,184,0.2)' }}
          />
          <YAxis
            tick={{ fontSize:10, fill:'#8a98a6', fontFamily:'Outfit,sans-serif', fontWeight:700 }}
            tickLine={false} axisLine={false} allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(23,107,135,0.04)' }} />
          <Bar dataKey="count" radius={[8,8,0,0]} maxBarSize={60}>
            {freqData.map((entry) => (
              <Cell key={entry.emotion} fill={entry.color} opacity={0.82} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Pill breakdown below chart */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:20 }}>
        {freqData.map(e => {
          const pct = total ? ((e.count / total) * 100).toFixed(0) : 0;
          return (
            <div key={e.emotion} style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
              borderRadius:999, background:'rgba(255,255,255,0.82)',
              border:'1px solid rgba(148,163,184,0.24)',
              fontFamily:'Outfit,sans-serif'
            }}>
              <span className="material-icons" style={{ fontSize:'1rem', color: e.color }}>{e.icon}</span>
              <span style={{ fontSize:'0.88rem', fontWeight:700, color:'#5a6b7f', textTransform:'capitalize' }}>{e.label}</span>
              <strong style={{ fontSize:'0.88rem', fontWeight:800, color: e.textColor }}>{e.count}</strong>
              <span style={{ fontSize:'0.78rem', color:'#8a98a6', fontWeight:700 }}>({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
