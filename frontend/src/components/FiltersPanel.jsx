export function FiltersPanel({
  areaMenuRef,
  areas,
  selectedAreas,
  selectedAreaIds,
  areasLoading,
  areasError,
  isAreaMenuOpen,
  setIsAreaMenuOpen,
  toggleArea,
  removeArea,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  validationError,
  dashboardError,
  fetchDashboardData,
  dashboardLoading,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-slate-800">Filters</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Area</label>

          <div className="relative" ref={areaMenuRef}>
            <button
              type="button"
              onClick={() => setIsAreaMenuOpen((prev) => !prev)}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-400"
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
                {areasLoading && <p className="p-2 text-sm text-slate-500">Loading areas...</p>}

                {areasError && <p className="p-2 text-sm text-red-600">{areasError}</p>}

                {!areasLoading && !areasError && !areas.length && (
                  <p className="p-2 text-sm text-slate-500">No areas available.</p>
                )}

                {!areasLoading &&
                  !areasError &&
                  areas.map((area) => {
                    const checked = selectedAreaIds.includes(area.area_id)

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
                    )
                  })}
              </div>
            )}
          </div>

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
                    className="cursor-pointer rounded-full px-1 text-blue-700 hover:bg-blue-100"
                    aria-label={`Remove ${area.area_name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="dateFrom" className="mb-2 block text-sm font-medium text-slate-700">
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

        <div>
          <label htmlFor="dateTo" className="mb-2 block text-sm font-medium text-slate-700">
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

      {validationError && <p className="mt-3 text-sm text-red-600">{validationError}</p>}

      {dashboardError && <p className="mt-3 text-sm text-red-600">{dashboardError}</p>}

      <div className="mt-4">
        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={dashboardLoading || areasLoading || !!areasError}
          className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {dashboardLoading ? 'Loading...' : 'View'}
        </button>
      </div>
    </section>
  )
}
