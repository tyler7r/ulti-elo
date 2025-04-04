import { useTheme } from "@mui/material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AxisDomain } from "recharts/types/util/types"; // Ensure this import exists

interface EloHistoryChartProps {
  data: { date: string; elo: number }[];
}

interface CustomTooltipPayloadItem {
  color?: string;
  name?: string | number;
  value?: number | string;
}

const EloHistoryChart = ({ data }: EloHistoryChartProps) => {
  const allEloValues = data.map((item) => item.elo);
  const minElo: number =
    allEloValues.length > 0 ? Math.min(...allEloValues) : 0;
  const yAxisDomain: AxisDomain = [Math.max(0, minElo - 100), "auto"];
  const theme = useTheme();

  const renderTooltipContent = (o: {
    active?: boolean;
    payload?: CustomTooltipPayloadItem[];
    label?: string | number;
  }) => {
    const { active, payload, label } = o;
    if (active && payload && payload.length) {
      return (
        <div className="recharts-custom-tooltip">
          <p className="label text-xs">{`${label}`}</p>
          {payload.map((entry: CustomTooltipPayloadItem, index: number) => (
            <p
              key={`item-${index}`}
              className="text-xs"
              style={{ color: entry.color || "black" }}
            >
              {`Elo: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="2 2"
          stroke={theme.palette.divider}
          strokeWidth={2}
        />
        <XAxis
          dataKey="date"
          tickMargin={5}
          fontSize={12}
          interval="preserveEnd"
          stroke={theme.palette.text.primary}
        />
        <YAxis
          domain={yAxisDomain}
          fontSize={12}
          stroke={theme.palette.text.primary}
          width={35}
          fontWeight={"bold"}
        />
        <Tooltip content={renderTooltipContent} />
        <Line
          type="linear"
          dataKey="elo"
          stroke={theme.palette.secondary.main} // Use the first color as we only have one line
          activeDot={{ r: 8 }}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EloHistoryChart;
