import { formatPercentage } from '../utils/format'

export function BrandComplianceTableSection({
  hasViewed,
  dashboardLoading,
  tableData,
  appliedAreaIds,
  appliedAreaNameById,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-slate-800">Brand Compliance Table</h2>

      {!hasViewed && (
        <p className="mt-4 text-sm text-slate-500">
          Select filters and click View to see brand compliance details.
        </p>
      )}

      {hasViewed && !dashboardLoading && !tableData.length && (
        <p className="mt-4 text-sm text-slate-500">No table data found for the applied filters.</p>
      )}

      {hasViewed && (
        <div className="mt-4 overflow-x-auto">
          {dashboardLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading table...</div>
          ) : tableData.length > 0 ? (
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="px-4 py-3 text-left font-semibold">Brand</th>

                  {appliedAreaIds.map((areaId) => (
                    <th key={areaId} className="px-4 py-3 text-right font-semibold">
                      {appliedAreaNameById.get(areaId) ?? `Area ${areaId}`}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tableData.map((brand) => {
                  const complianceByArea = new Map(
                    brand.areas.map((area) => [area.area_id, area.compliance_percentage]),
                  )

                  return (
                    <tr key={brand.brand_id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">{brand.brand_name}</td>

                      {appliedAreaIds.map((areaId) => (
                        <td key={`${brand.brand_id}-${areaId}`} className="px-4 py-3 text-right text-slate-700">
                          {complianceByArea.has(areaId)
                            ? formatPercentage(complianceByArea.get(areaId))
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      )}
    </section>
  )
}
