import React, { useState, useEffect } from "react";
import {
  BarChart3, // For the main title icon
  Filter,
  Download,
  RefreshCw,
  Calendar as CalendarIcon, // Renamed to avoid conflict
  HelpCircle,
  X as XIcon, // Renamed to avoid conflict
  Loader2, // For loading states
  Clock, // For last update timestamp
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  Legend,
  Brush,
} from "recharts";
import { useSupabaseData } from "../../hooks/useSupabaseData"; // Keep this for data fetching
import toast from "react-hot-toast"; // For notifications

interface KpiCardProps {
  // Renamed to KpiCardProps
  label: string; // Renamed from title
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricsCard({ title, value, change, isPositive }: KpiCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
      {" "}
      {/* Updated styling */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">{title}</span>{" "}
          {/* Updated styling */}
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp
            className={`w-4 h-4 ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          />
          <span
            className={`text-sm ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

export function VentasDashboard() {
  const [showFilters, setShowFilters] = useState(false); // Renamed from showFiltersPanel
  const [showAnterior, setShowAnterior] = useState(false); // Renamed from showPreviousPeriod
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(
    new Date().toLocaleString("es-CL")
  );
  const [filters, setFilters] = useState({
    fechaInicio: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Default to 14 days ago
    fechaFin: new Date().toISOString().split("T")[0], // Default to today
    sucursal: "",
    metodo_pago: "",
    producto: "",
    cajas: [] as string[],
  });

  // Use a separate state for KPI data to avoid re-calculating on every render
  const [kpiData, setKpiData] = useState({
    ventasTotales: 0,
    margen: 0,
    unidadesVendidas: 0,
    numeroVentas: 0,
    ticketPromedio: 0,
  });
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  const { data: ventas = [], refetch } = useSupabaseData<any>(
    "ventas",
    "*, sucursales(nombre)"
  ); // Keep refetch for manual refresh
  const { data: ventaItems = [] } = useSupabaseData<any>(
    "venta_items",
    "*, productos(nombre, costo)"
  );
  const { data: sucursales = [] } = useSupabaseData<any>("sucursales", "*");
  const { data: productos = [] } = useSupabaseData<any>("productos", "*");

  // Apply filters to ventas data
  const filteredVentas = ventas.filter((venta) => {
    if (
      filters.fechaInicio &&
      new Date(venta.fecha) < new Date(filters.fechaInicio)
    )
      return false;
    if (filters.fechaFin && new Date(venta.fecha) > new Date(filters.fechaFin))
      return false;
    if (filters.sucursal && venta.sucursal_id !== filters.sucursal)
      return false;
    if (filters.metodo_pago && venta.metodo_pago !== filters.metodo_pago)
      return false;
    return true;
  });

  // Format currency (CLP)
  const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(n);

  const calculateKpis = React.useCallback(() => {
    const currentYear = new Date(filters.fechaFin).getFullYear(); // Use year from selected end date
    const yearVentas = showAnterior
      ? filteredVentas.filter(
          (v) => new Date(v.fecha).getFullYear() === currentYear - 1
        )
      : filteredVentas.filter(
          (v) => new Date(v.fecha).getFullYear() === currentYear
        );

    const totalVentas = yearVentas.reduce(
      (sum, venta) => sum + (parseFloat(venta.total) || 0),
      0
    );
    const totalUnidades = ventaItems
      .filter((item) => yearVentas.some((venta) => venta.id === item.venta_id))
      .reduce((sum, item) => sum + (item.cantidad || 0), 0);
    const numeroVentas = yearVentas.length;
    const ticketPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0;

    const totalCosto = ventaItems
      .filter((item) => yearVentas.some((venta) => venta.id === item.venta_id))
      .reduce((sum, item) => {
        const producto = productos.find((p) => p.id === item.producto_id);
        return sum + (producto?.costo || 0) * item.cantidad;
      }, 0);
    const margen = totalVentas - totalCosto;

    setKpiData({
      ventasTotales: totalVentas || 0,
      margen: margen || 0,
      unidadesVendidas: totalUnidades || 0,
      numeroVentas: numeroVentas,
      ticketPromedio: ticketPromedio,
    });
  }, [filteredVentas, filters.fechaFin, productos, ventaItems, showAnterior]);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const calculateMonthlyChartData = React.useCallback(() => {
    console.log("📊 VENTAS: Calculando datos del gráfico", { filters });

    // Si hay filtros de fecha específicos, crear datos por día
    if (filters.fechaInicio && filters.fechaFin) {
      const startDate = new Date(filters.fechaInicio);
      const endDate = new Date(filters.fechaFin);

      console.log("📅 VENTAS: Filtro de fechas específico", {
        startDate,
        endDate,
      });
      const dayData = [];

      // Crear datos día por día
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dayName = d.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        });
        const currentYear = d.getFullYear();
        const previousYear = currentYear - 1;

        const dayEntry = { mes: dayName, actual: 0, anterior: 0 };

        filteredVentas.forEach((venta) => {
          const ventaDate = new Date(venta.fecha);
          if (ventaDate.toDateString() === d.toDateString()) {
            const year = ventaDate.getFullYear();
            const total = parseFloat(venta.total) || 0;

            if (year === currentYear) {
              dayEntry.actual += total;
            } else if (year === previousYear) {
              dayEntry.anterior += total;
            }
          }
        });

        dayData.push(dayEntry);
      }

      setMonthlyChartData(dayData);
      return;
    }

    // Lógica original para meses
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    // Si hay filtros de fecha específicos, mostrar solo ese rango
    if (filters.fechaInicio && filters.fechaFin) {
      const startDate = new Date(filters.fechaInicio);
      const endDate = new Date(filters.fechaFin);

      // Si es el mismo mes, mostrar solo ese mes
      if (
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getFullYear() === endDate.getFullYear()
      ) {
        console.log("📅 VENTAS: Mismo mes detectado, mostrando solo ese mes");
        const monthName = months[startDate.getMonth()];
        const currentYear = startDate.getFullYear();
        const previousYear = currentYear - 1;

        const monthData = { mes: monthName, actual: 0, anterior: 0 };

        filteredVentas.forEach((venta) => {
          const ventaDate = new Date(venta.fecha);
          if (ventaDate.getMonth() === startDate.getMonth()) {
            const year = ventaDate.getFullYear();
            const total = parseFloat(venta.total) || 0;

            if (year === currentYear) {
              monthData.actual += total;
            } else if (year === previousYear) {
              monthData.anterior += total;
            }
          }
        });

        setMonthlyChartData([monthData]);
        console.log("✅ VENTAS: Datos de un solo mes calculados", monthData);
        return;
      }
    }

    // Lógica original para mostrar todos los meses
    const currentYear = new Date(filters.fechaFin).getFullYear();
    const previousYear = currentYear - 1;

    const dataMap = new Map<
      string,
      { mes: string; actual: number; anterior: number }
    >();

    months.forEach((monthName, index) => {
      dataMap.set(monthName, { mes: monthName, actual: 0, anterior: 0 });
    });

    filteredVentas.forEach((venta) => {
      const ventaDate = new Date(venta.fecha);
      const monthName = months[ventaDate.getMonth()];
      const year = ventaDate.getFullYear();
      const total = parseFloat(venta.total) || 0;

      if (dataMap.has(monthName)) {
        const entry = dataMap.get(monthName)!;
        if (year === currentYear) {
          entry.actual += total;
        } else if (year === previousYear) {
          entry.anterior += total;
        }
      }
    });

    setMonthlyChartData(Array.from(dataMap.values()));
    console.log(
      "✅ VENTAS: Datos mensuales calculados",
      Array.from(dataMap.values()).length,
      "meses"
    );
  }, [filteredVentas, filters.fechaFin]);

  React.useEffect(() => {
    calculateKpis();
    calculateMonthlyChartData();
  }, [
    calculateKpis,
    calculateMonthlyChartData,
    ventas,
    ventaItems,
    productos,
    filters,
  ]); // Recalculate when dependencies change

  const kpiCardsData = [
    {
      label: "Ventas totales",
      value: formatPrice(kpiData.ventasTotales),
      change: "+100%",
      isPositive: true,
    },
    {
      label: "Margen",
      value: formatPrice(kpiData.margen),
      change: "+100%",
      isPositive: true,
    },
    {
      label: "Unidades vendidas",
      value: kpiData.unidadesVendidas.toLocaleString("es-CL"),
      change: "+100%",
      isPositive: true,
    },
    {
      label: "N° de ventas",
      value: kpiData.numeroVentas.toLocaleString("es-CL"),
      change: "+100%",
      isPositive: true,
    },
    {
      label: "Ticket promedio",
      value: formatPrice(Math.round(kpiData.ticketPromedio)),
      change: "+100%",
      isPositive: true,
    },
  ];

  const handleDownloadReport = (type: "excel" | "template") => {
    try {
      if (type === "excel") {
        const headers = ["Folio", "Fecha", "Total", "Sucursal", "Método Pago", "Cliente", "Usuario", "Tipo DTE", "Estado"];
        const csvContent = [
          headers.join(","),
          ...filteredVentas.map((v) =>
            [
              `"${v.folio || "N/A"}"`,
              `"${new Date(v.fecha).toLocaleDateString("es-CL")}"`,
              `"${v.total || "0"}"`,
              `"${v.sucursales?.nombre || "N/A"}"`,
              `"${v.metodo_pago || "N/A"}"`,
              `"${v.cliente_id || "Cliente General"}"`,
              `"${v.usuario_id || "Sistema"}"`,
              `"${v.tipo_dte || "boleta"}"`,
              `"${v.estado || "completado"}"`,
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_ventas_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Reporte de ventas descargado.");
      } else if (type === "template") {
        const headers = ["Producto", "Stock"];
        const csvContent = headers.join(",") + "\n"; // Just header for template
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `plantilla_productos_stock_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Plantilla de productos y stock descargada.");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Error al descargar el reporte.");
    }
  };

  const handleCajaChange = (caja: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      cajas: checked
        ? [...prev.cajas, caja] // Add caja if checked
        : prev.cajas.filter((c) => c !== caja),
    }));
  };

  return (
    <div className="h-screen bg-white flex flex-col relative">
      {" "}
      {/* Full height container */}
      {/* Header with action buttons */}
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Reportes de Ventas
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(true)}
            className="group flex flex-col items-center text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-lg hover:bg-blue-50 text-center"
            title="Filtrar"
          >
            <Filter className="w-4 h-4" />
            <span className="text-[10px] mt-1">Filtros</span>
          </button>
          <button
            onClick={() => handleDownloadReport("excel")}
            className="group flex flex-col items-center text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-lg hover:bg-blue-50 text-center"
            title="Descargar Excel"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] mt-1">Excel</span>
          </button>
          <button
            onClick={() => refetch()}
            className="group flex flex-col items-center text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-lg hover:bg-blue-50 text-center"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="text-center">
              <div className="font-medium">{formatTime(currentTime)}</div>
            </div>
            {/* <Clock className="w-4 h-4" /> */}
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {loadingKpis ? (
            <div className="col-span-full text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">Cargando KPIs...</p>
            </div>
          ) : kpiError ? (
            <div className="col-span-full text-center py-8 text-red-600">
              <p>{kpiError}</p>
              <button
                onClick={() => {
                  setKpiError(null); // Clear error before retrying
                  calculateKpis();
                }}
                className="mt-2 text-blue-600 hover:underline flex items-center justify-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Reintentar
              </button>
            </div>
          ) : (
            kpiCardsData.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {kpi.label}
                  </span>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-2xl font-semibold text-gray-900">
                    {kpi.value}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Ventas totales por mes
            </h3>
            <button
              onClick={() => refetch()} // Use refetch from useSupabaseData to trigger data reload
              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
              disabled={loadingChart || loadingKpis}
              title="Actualizar datos"
            >
              {loadingChart || loadingKpis ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>Período anterior</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span>Período seleccionado</span>
            </div>
            <CalendarIcon className="w-4 h-4" />
          </div>

          {/* Recharts */}
          {loadingChart ? (
            <div className="h-[300px] flex items-center justify-center flex-col">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-gray-600 mt-3">Cargando gráfico...</p>
            </div>
          ) : chartError ? (
            <div className="h-[300px] flex items-center justify-center flex-col text-red-600">
              <p>{chartError}</p>
              <button
                onClick={() => {
                  setChartError(null); // Clear error before retrying
                  calculateMonthlyChartData();
                }}
                className="mt-2 text-blue-600 hover:underline flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Reintentar
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={monthlyChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  stroke="#eee"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(n) => formatPrice(n)}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  content={<CustomTooltip formatPrice={formatPrice} />}
                />{" "}
                {/* Pass formatPrice to CustomTooltip */}
                {showAnterior && (
                  <Line
                    type="monotone"
                    dataKey="anterior"
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    dot={false}
                    name="Período anterior"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  dot={false}
                  name="Período seleccionado"
                />
                <Brush dataKey="mes" height={30} stroke="#1E40AF" />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* Toggle */}
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnterior}
                onChange={(e) => setShowAnterior(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Ver período anterior
            </label>
          </div>
        </div>
      </div>
      {/* Filters Sidebar (Permanece como overlay) */}
      {showFilters && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 p-6 shadow-lg z-20 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-800">Filtros</h4>
            <button
              onClick={() => setShowFilters(false)}
              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
              title="Cerrar filtros"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto pb-4">
            {/* Date Range */}
            <div>
              <label
                htmlFor="fInicio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Rango de fechas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="fInicio"
                  value={filters.fechaInicio}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fechaInicio: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">–</span>
                <input
                  type="date"
                  id="fFin"
                  value={filters.fechaFin}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fechaFin: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sucursal */}
            <div>
              <label
                htmlFor="sucursal-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sucursal
              </label>
              <select
                id="sucursal-select"
                value={filters.sucursal}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sucursal: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Método de Pago */}
            <div>
              <label
                htmlFor="metodo-pago-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Método de Pago
              </label>
              <select
                id="metodo-pago-select"
                value={filters.metodo_pago}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    metodo_pago: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los métodos</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            {/* Producto */}
            <div>
              <label
                htmlFor="producto-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Producto
              </label>
              <input
                id="producto-input"
                type="text"
                placeholder="Buscar producto..."
                value={filters.producto}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, producto: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Cashiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cajeros
              </label>
              <div className="space-y-2 text-sm">
                {["Caja N°1", "Caja N°2", "Caja N°3", "Caja N°4"].map(
                  (caja) => (
                    <label
                      key={caja}
                      htmlFor={`caja-${caja}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        id={`caja-${caja}`}
                        type="checkbox"
                        checked={filters.cajas.includes(caja)}
                        onChange={(e) =>
                          handleCajaChange(caja, e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-800">{caja}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset-filters"
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters({
                      fechaInicio: new Date(
                        Date.now() - 14 * 24 * 60 * 60 * 1000
                      )
                        .toISOString()
                        .split("T")[0],
                      fechaFin: new Date().toISOString().split("T")[0],
                      sucursal: "",
                      metodo_pago: "",
                      producto: "",
                      cajas: [],
                    });
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="reset-filters" className="text-sm text-gray-700">
                Restablecer filtros
              </label>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                calculateKpis();
                calculateMonthlyChartData();
                setShowFilters(false);
                toast.success("Filtros aplicados");
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
              disabled={loadingKpis || loadingChart}
            >
              {(loadingKpis || loadingChart) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Tooltip for Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    stroke: string;
  }>;
  label?: string;
  formatPrice: (n: number) => string; // Add formatPrice prop
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatPrice,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.stroke }}>
            {entry.name === "actual"
              ? "Periodo seleccionado"
              : "Periodo anterior"}
            : <span className="font-medium">{formatPrice(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
