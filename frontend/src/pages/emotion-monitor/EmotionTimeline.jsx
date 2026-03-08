import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const EMOTIONS = ['happy','neutral','sad','angry','fear','disgust','surprise'];
const EMOTION_COLORS = {
  happy:'#0f9f74', neutral:'#176b87', sad:'#5a6b9f',
  angry:'#df5a6a', fear:'#9b5de5', disgust:'#6a8f3c', surprise:'#f28c28',
};
const EMOTION_IDX = Object.fromEntries(EMOTIONS.map((e,i) => [e, i+1]));

const CustomDot = ({ cx, cy, payload }) => (
  <circle cx={cx} cy={cy} r={5} fill={EMOTION_COLORS[payload?.emotion] || '#176b87'} stroke="#fff" strokeWidth={2} />
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const color = EMOTION_COLORS[d?.emotion] || '#176b87';
  return (
    <div style={{
      background:'rgba(255,255,255,0.96)', border:`1px solid ${color}33`,
      borderRadius:14, padding:'10px 14px', fontFamily:'Outfit,sans-serif',
      boxShadow:'0 8px 24px -8px rgba(15,23,42,0.18)'
    }}>
      <div style={{ fontSize:11, color:'#8a98a6', fontWeight:700, marginBottom:4 }}>{d?.time}</div>
      <div style={{ fontSize:15, color, fontWeight:800, textTransform:'capitalize' }}>{d?.emotion}</div>
      {d?.confidence != null && <div style={{ fontSize:12, color:'#5a6b7f', marginTop:2 }}>{d.confidence.toFixed(1)}% confidence</div>}
    </div>
  );
};

export default function EmotionTimeline({ history }) {
  const data = history.slice(-50).map(r => ({ ...r, value: EMOTION_IDX[r.emotion] || 1 }));
  return (
    <div style={{ width:'100%', padding:'8px 0' }}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top:10, right:16, left:-10, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize:10, fill:'#8a98a6', fontFamily:'Outfit,sans-serif', fontWeight:700 }}
            interval="preserveStartEnd" tickLine={false}
            axisLine={{ stroke:'rgba(148,163,184,0.2)' }}
          />
          <YAxis
            domain={[0.5,7.5]}
            ticks={EMOTIONS.map((_,i)=>i+1)}
            tickFormatter={v => EMOTIONS[v-1]?.charAt(0).toUpperCase() + EMOTIONS[v-1]?.slice(1,4) || ''}
            tick={{ fontSize:10, fill:'#8a98a6', fontFamily:'Outfit,sans-serif', fontWeight:700 }}
            tickLine={false} axisLine={false} width={46}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="value" stroke="rgba(148,163,184,0.3)" strokeWidth={2}
            dot={<CustomDot />} activeDot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
