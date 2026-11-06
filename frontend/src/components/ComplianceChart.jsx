import { memo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPercentage } from '../utils/format'

export const ComplianceChart = memo(function ComplianceChart({ data }) {
  return (
    <div className="mt-4 h-80 w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="area_name" tick={{ fill: '#334155', fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: '#334155', fontSize: 12 }}
            />
            <Tooltip formatter={(value) => [formatPercentage(value), 'Nilai']} />
            <Legend />
            <Bar
              dataKey="compliance_percentage"
              name="Nilai"
              fill="#2563eb"
              radius={[8, 8, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="compliance_percentage"
                position="top"
                formatter={(value) => formatPercentage(value)}
                fill="#1e293b"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-slate-500">No chart data found for the applied filters.</p>
      )}
    </div>
  )
})
