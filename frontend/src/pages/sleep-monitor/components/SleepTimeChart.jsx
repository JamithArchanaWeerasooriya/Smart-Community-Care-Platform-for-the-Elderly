import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function SleepTimeChart({ sessions }) {

  const sleepTimeGraph = Object.values(

    sessions.reduce((acc, s) => {

      const d = new Date(s.createdAt);
      const key = d.toISOString().split("T")[0];

      if (!acc[key]) acc[key] = s;
      else if (new Date(acc[key].createdAt) < d) acc[key] = s;

      return acc;

    }, {})

  )

  .sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt))

  .map(s=>{

    const d = new Date(s.createdAt);

    const hour = d.getHours();
    const min = d.getMinutes();

    return {
      day: d.toLocaleDateString("en-US",{weekday:"short"}),
      time: hour + min/60
    };

  });


  const formatTime = (value)=>{

    let h = Math.floor(value);
    let m = Math.round((value-h)*60);

    if(h>=24) h -= 24;
    if(h===0) h = 12;

    return `${h}:${m.toString().padStart(2,"0")}`;

  };



  return (

    <div
      style={{
        background:"white",
        borderRadius:"24px",
        padding:"24px",
        marginTop:"24px",
        boxShadow:"0 20px 40px -30px rgba(0,0,0,0.3)"
      }}
    >

      <h3
        style={{
          fontWeight:800,
          fontSize:"1.2rem",
          marginBottom:"16px"
        }}
      >
        Went to Bed Time
      </h3>


      <ResponsiveContainer width="100%" height={240}>

        <LineChart data={sleepTimeGraph}>

          <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>

          <XAxis
            dataKey="day"
            tick={{fontSize:13}}
          />

          <YAxis
            domain={[22,25]}
            tickFormatter={formatTime}
            tick={{fontSize:12}}
          />

          <Tooltip
            formatter={(v)=>formatTime(v)}
          />

          <Line
            type="monotone"
            dataKey="time"
            stroke="#176b87"
            strokeWidth={3}
            dot={{r:6}}
            activeDot={{r:8}}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default SleepTimeChart;