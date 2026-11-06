import { ComplianceChart } from './ComplianceChart'

export function ChartSection({ hasViewed, dashboardLoading, chartData }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-slate-800">Compliance Chart</h2>

      {!hasViewed && (
        <p className="mt-4 text-sm text-slate-500">
          Select at least one area and click View to see chart data.
        </p>
      )}

      {hasViewed && dashboardLoading && (
        <div className="mt-4 flex h-80 items-center justify-center text-sm text-slate-500">
          Loading chart...
        </div>
      )}

      {hasViewed && !dashboardLoading && <ComplianceChart data={chartData} />}
    </section>
  )
}
