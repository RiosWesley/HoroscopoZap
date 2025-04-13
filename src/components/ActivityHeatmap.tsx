
import React from 'react';

interface ActivityHeatmapProps {
  hourlyActivity: number[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ hourlyActivity }) => {
  // Get the max value for scaling
  const maxActivity = Math.max(...hourlyActivity);
  
  return (
    <div className="w-full overflow-auto">
      <div className="flex items-end h-40 gap-1 min-w-full">
        {hourlyActivity.map((count, hour) => {
          const height = count === 0 ? 5 : Math.max(15, (count / maxActivity) * 100);
          let timeOfDay;
          
          if (hour < 6) timeOfDay = 'dawn';
          else if (hour < 12) timeOfDay = 'morning';
          else if (hour < 18) timeOfDay = 'afternoon';
          else timeOfDay = 'night';
          
          const colorMap = {
            dawn: 'from-indigo-500 to-purple-500',
            morning: 'from-blue-400 to-cyan-300',
            afternoon: 'from-yellow-400 to-orange-400',
            night: 'from-purple-800 to-indigo-900'
          };
          
          return (
            <div key={hour} className="flex flex-col items-center">
              <div 
                className={`w-6 bg-gradient-to-t ${colorMap[timeOfDay]} rounded-t-sm transition-all hover:opacity-80`} 
                style={{ height: `${height}%` }}
                title={`${count} mensagens às ${hour}:00`}
              />
              <span className={`text-xs mt-1 ${hour === new Date().getHours() ? 'font-bold' : ''}`}>
                {hour}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-center mt-2 opacity-70">Horário de atividade (24h)</p>
    </div>
  );
};

export default ActivityHeatmap;
