import { useEffect, useMemo, useRef, useState } from 'react'
import { API_URL } from './constants/api'
import { BrandComplianceTableSection } from './components/BrandComplianceTableSection'
import { ChartSection } from './components/ChartSection'
import { FiltersPanel } from './components/FiltersPanel'

function App() {
  const [areas, setAreas] = useState([])
  const [selectedAreaIds, setSelectedAreaIds] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedFilters, setAppliedFilters] = useState(null)
  const [chartData, setChartData] = useState([])
  const [tableData, setTableData] = useState([])
  const [areasLoading, setAreasLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [areasError, setAreasError] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [hasViewed, setHasViewed] = useState(false)
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false)
  const areaMenuRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const fetchAreas = async () => {
      setAreasLoading(true)
      setAreasError('')

      try {
        const response = await fetch(`${API_URL}/api/areas`)

        if (!response.ok) {
          throw new Error('Failed to fetch areas')
        }

        const payload = await response.json()
        setAreas(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        setAreasError(
          error instanceof Error ? error.message : 'Failed to fetch areas',
        )
      } finally {
        setAreasLoading(false)
      }
    }

    fetchAreas()
  }, [])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (areaMenuRef.current && !areaMenuRef.current.contains(event.target)) {
        setIsAreaMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)

    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  const selectedAreas = useMemo(() => {
    const selectedSet = new Set(selectedAreaIds)
    return areas.filter((area) => selectedSet.has(area.area_id))
  }, [areas, selectedAreaIds])

  const appliedAreas = useMemo(() => {
    if (!appliedFilters) {
      return []
    }

    const appliedSet = new Set(appliedFilters.areaIds)
    return areas.filter((area) => appliedSet.has(area.area_id))
  }, [areas, appliedFilters])

  const appliedAreaIds = appliedFilters?.areaIds ?? []

  const appliedAreaNameById = useMemo(() => {
    const map = new Map()

    for (const area of appliedAreas) {
      map.set(area.area_id, area.area_name)
    }

    return map
  }, [appliedAreas])

  const toggleArea = (areaId) => {
    setValidationError('')

    setSelectedAreaIds((prev) => {
      if (prev.includes(areaId)) {
        return prev.filter((id) => id !== areaId)
      }

      return [...prev, areaId]
    })
  }

  const removeArea = (areaId) => {
    setSelectedAreaIds((prev) => prev.filter((id) => id !== areaId))
  }

  const fetchDashboardData = async () => {
    setValidationError('')
    setDashboardError('')

    if (!selectedAreaIds.length) {
      setValidationError('Please select at least one area before viewing the dashboard.')
      return
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setValidationError('Date From cannot be later than Date To.')
      return
    }

    const filters = {
      areaIds: [...selectedAreaIds],
      dateFrom,
      dateTo,
    }

    const params = new URLSearchParams()
    params.set('areaIds', filters.areaIds.join(','))

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom)
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo)
    }

    const currentRequestId = ++requestIdRef.current
    setDashboardLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/dashboard?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message ?? 'Failed to fetch dashboard data')
      }

      if (currentRequestId !== requestIdRef.current) {
        return
      }

      setAppliedFilters(filters)
      setChartData(Array.isArray(payload.chart) ? payload.chart : [])
      setTableData(Array.isArray(payload.table) ? payload.table : [])
      setHasViewed(true)
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return
      }

      setDashboardError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard data',
      )
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setDashboardLoading(false)
      }
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">Product Compliance Dashboard</h1>

        <FiltersPanel
          areaMenuRef={areaMenuRef}
          areas={areas}
          selectedAreas={selectedAreas}
          selectedAreaIds={selectedAreaIds}
          areasLoading={areasLoading}
          areasError={areasError}
          isAreaMenuOpen={isAreaMenuOpen}
          setIsAreaMenuOpen={setIsAreaMenuOpen}
          toggleArea={toggleArea}
          removeArea={removeArea}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          validationError={validationError}
          dashboardError={dashboardError}
          fetchDashboardData={fetchDashboardData}
          dashboardLoading={dashboardLoading}
        />

        <ChartSection hasViewed={hasViewed} dashboardLoading={dashboardLoading} chartData={chartData} />

        <BrandComplianceTableSection
          hasViewed={hasViewed}
          dashboardLoading={dashboardLoading}
          tableData={tableData}
          appliedAreaIds={appliedAreaIds}
          appliedAreaNameById={appliedAreaNameById}
        />
      </div>
    </main>
  )
}

export default App
