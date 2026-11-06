
import { memo, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL;

const formatPercentage = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return `${Number(value).toFixed(2).replace(/\.?0+$/, '')}%`;
};

// Memoized chart: draft filter changes won't trigger chart re-render.
const ComplianceChart = memo(function ComplianceChart({ data }) {
  return (
    <div className="mt-4 h-80 w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="area_name"
              tick={{ fill: '#334155', fontSize: 12 }}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: '#334155', fontSize: 12 }}
            />

            <Tooltip
              formatter={(value) => [
                formatPercentage(value),
                'Nilai',
              ]}
            />

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
        <p className="text-sm text-slate-500">
          No chart data found for the applied filters.
        </p>
      )}
    </div>
  );
});

function App() {
  const [areas, setAreas] = useState([]);

  // Draft filters: only used by the filter controls.
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Applied filters: only updated when View is clicked.
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [areasLoading, setAreasLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [areasError, setAreasError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [validationError, setValidationError] = useState('');

  const [hasViewed, setHasViewed] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);

  const areaMenuRef = useRef(null);
  const requestIdRef = useRef(0);

  // Fetch available areas.
  useEffect(() => {
    const fetchAreas = async () => {
      setAreasLoading(true);
      setAreasError('');

      try {
        const response = await fetch(`${API_URL}/api/areas`);

        if (!response.ok) {
          throw new Error('Failed to fetch areas');
        }

        const payload = await response.json();
        setAreas(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        setAreasError(
          error instanceof Error ? error.message : 'Failed to fetch areas',
        );
      } finally {
        setAreasLoading(false);
      }
    };

    fetchAreas();
  }, []);

  // Close area dropdown when clicking outside.
  useEffect(() => {
    const onClickOutside = (event) => {
      if (
        areaMenuRef.current &&
        !areaMenuRef.current.contains(event.target)
      ) {
        setIsAreaMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  // Draft selected areas.
  const selectedAreas = useMemo(() => {
    const selectedSet = new Set(selectedAreaIds);

    return areas.filter((area) => selectedSet.has(area.area_id));
  }, [areas, selectedAreaIds]);

  // Applied selected areas.
  const appliedAreas = useMemo(() => {
    if (!appliedFilters) return [];

    const appliedSet = new Set(appliedFilters.areaIds);

    return areas.filter((area) => appliedSet.has(area.area_id));
  }, [areas, appliedFilters]);

  const appliedAreaIds = appliedFilters?.areaIds ?? [];

  const appliedAreaNameById = useMemo(() => {
    const map = new Map();

    for (const area of appliedAreas) {
      map.set(area.area_id, area.area_name);
    }

    return map;
  }, [appliedAreas]);

  // Toggle draft area selection.
  const toggleArea = (areaId) => {
    setValidationError('');

    setSelectedAreaIds((prev) => {
      if (prev.includes(areaId)) {
        return prev.filter((id) => id !== areaId);
      }

      return [...prev, areaId];
    });
  };

  // Remove draft area selection.
  const removeArea = (areaId) => {
    setSelectedAreaIds((prev) =>
      prev.filter((id) => id !== areaId),
    );
  };

  // Fetch dashboard data only when View is clicked.
  const fetchDashboardData = async () => {
    setValidationError('');
    setDashboardError('');

    if (!selectedAreaIds.length) {
      setValidationError(
        'Please select at least one area before viewing the dashboard.',
      );
      return;
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setValidationError(
        'Date From cannot be later than Date To.',
      );
      return;
    }

    const filters = {
      areaIds: [...selectedAreaIds],
      dateFrom,
      dateTo,
    };

    const params = new URLSearchParams();

    params.set('areaIds', filters.areaIds.join(','));

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom);
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo);
    }

    // Prevent an older request from overwriting newer results.
    const currentRequestId = ++requestIdRef.current;

    setDashboardLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/dashboard?${params.toString()}`,
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.message ?? 'Failed to fetch dashboard data',
        );
      }

      if (currentRequestId !== requestIdRef.current) return;

      // Update applied filters and dashboard data together.
      setAppliedFilters(filters);

      setChartData(
        Array.isArray(payload.chart) ? payload.chart : [],
      );

      setTableData(
        Array.isArray(payload.table) ? payload.table : [],
      );

      setHasViewed(true);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;

      setDashboardError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard data',
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setDashboardLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
          Product Compliance Dashboard
        </h1>

        {/* Filters */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Filters
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">

            {/* Area Filter */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Area
              </label>

              <div className="relative" ref={areaMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAreaMenuOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-400"
                >
                  <span>
                    {selectedAreas.length
                      ? `${selectedAreas.length} area(s) selected`
                      : 'Please select areas'}
                  </span>

                  <span className="text-slate-500">▾</span>
                </button>

                {isAreaMenuOpen && (
                  <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">

                    {areasLoading && (
                      <p className="p-2 text-sm text-slate-500">
                        Loading areas...
                      </p>
                    )}

                    {areasError && (
                      <p className="p-2 text-sm text-red-600">
                        {areasError}
                      </p>
                    )}

                    {!areasLoading && !areasError && !areas.length && (
                      <p className="p-2 text-sm text-slate-500">
                        No areas available.
                      </p>
                    )}

                    {!areasLoading &&
                      !areasError &&
                      areas.map((area) => {
                        const checked = selectedAreaIds.includes(
                          area.area_id,
                        );

                        return (
                          <label
                            key={area.area_id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleArea(area.area_id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />

                            <span>{area.area_name}</span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Selected area tags */}
              {!!selectedAreas.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAreas.map((area) => (
                    <span
                      key={area.area_id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {area.area_name}

                      <button
                        type="button"
                        onClick={() => removeArea(area.area_id)}
                        className="rounded-full px-1 text-blue-700 hover:bg-blue-100"
                        aria-label={`Remove ${area.area_name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date From */}
            <div>
              <label
                htmlFor="dateFrom"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date From
              </label>

              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Date To */}
            <div>
              <label
                htmlFor="dateTo"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date To
              </label>

              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

          </div>

          {validationError && (
            <p className="mt-3 text-sm text-red-600">
              {validationError}
            </p>
          )}

          {dashboardError && (
            <p className="mt-3 text-sm text-red-600">
              {dashboardError}
            </p>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={dashboardLoading || areasLoading || !!areasError}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {dashboardLoading ? 'Loading...' : 'View'}
            </button>
          </div>
        </section>

        {/* Compliance Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Compliance Chart
          </h2>

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

          {hasViewed && !dashboardLoading && (
            <ComplianceChart data={chartData} />
          )}
        </section>

        {/* Brand Compliance Table */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Brand Compliance Table
          </h2>

          {!hasViewed && (
            <p className="mt-4 text-sm text-slate-500">
              Select filters and click View to see brand compliance details.
            </p>
          )}

          {hasViewed && !dashboardLoading && !tableData.length && (
            <p className="mt-4 text-sm text-slate-500">
              No table data found for the applied filters.
            </p>
          )}

          {hasViewed && (
            <div className="mt-4 overflow-x-auto">
              {dashboardLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Loading table...
                </div>
              ) : tableData.length > 0 ? (
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <th className="px-4 py-3 text-left font-semibold">
                        Brand
                      </th>

                      {/* Use applied filters, not draft filters. */}
                      {appliedAreaIds.map((areaId) => (
                        <th
                          key={areaId}
                          className="px-4 py-3 text-right font-semibold"
                        >
                          {appliedAreaNameById.get(areaId) ??
                            `Area ${areaId}`}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tableData.map((brand) => {
                      const complianceByArea = new Map(
                        brand.areas.map((area) => [
                          area.area_id,
                          area.compliance_percentage,
                        ]),
                      );

                      return (
                        <tr
                          key={brand.brand_id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {brand.brand_name}
                          </td>

                          {appliedAreaIds.map((areaId) => (
                            <td
                              key={`${brand.brand_id}-${areaId}`}
                              className="px-4 py-3 text-right text-slate-700"
                            >
                              {complianceByArea.has(areaId)
                                ? formatPercentage(
                                    complianceByArea.get(areaId),
                                  )
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

export default App;
