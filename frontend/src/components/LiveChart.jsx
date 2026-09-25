import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const GRID_COLOR = '#eef1ee';
const TEXT_COLOR = '#5b6b60';

/** Generic live trend chart. `series` is [{ label, data: number[], color }]. */
export default function LiveChart({ labels, series, height = 240 }) {
  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.data,
      borderColor: s.color,
      backgroundColor: `${s.color}1a`,
      fill: s.fill ?? false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2.25,
    })),
  };

  const options = {
    responsive: true,
    animation: { duration: 250 },
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { display: false },
      y: {
        beginAtZero: false,
        grid: { color: GRID_COLOR },
        ticks: { color: TEXT_COLOR, font: { family: 'Inter', size: 11 } },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: TEXT_COLOR, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { family: 'Inter', size: 12 } },
      },
      tooltip: {
        backgroundColor: '#16211a',
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
