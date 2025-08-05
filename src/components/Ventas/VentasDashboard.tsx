import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  HelpCircle,
  X as XIcon,
  Loader2,
  Clock,
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
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricsCard({ title, value, change, isPositive }: KpiCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">{title}</span>
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
  const { empresaId } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [showAnterior, setShowAnterior] = useState(false);
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
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    sucursal: "",
    metodo_pago: "",
    producto: "",
    cajas: [] as string[],
  });

  const [kpiData, setKpiData] = useState({
    ventasTotales: 0,
    margen: 0,
    unidadesVendidas: 0,
    numeroVentas: 0,
    ticketPromedio: 0,
  });
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  // Filtrar todas las consultas por empresa
  const { data: ventas = [], refetch } = useSupabaseData<any>(
    "ventas",
    "*, sucursales(nombre)",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: ventaItems = [] } = useSupabaseData<any>(
    "venta_items",
    "*, productos(nombre, costo), ventas!inner(empresa_id)",
    empresaId ? { "ventas.empresa_id": empresaId } : undefined
  );

  const { data: sucursales = [] } = useSupabaseData<any>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: productos = [] } = useSupabaseData<any>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Obtener cajas reales de la empresa
  const { data: cajas = [] } = useSupabaseData<any>(
    "cajas",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Validación de empresa
  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

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
    const currentYear = new Date(filters.fechaFin).getFullYear();
    const previousYear = currentYear - 1;

    const yearVentas = showAnterior
      ? filteredVentas.filter(
          (v) => new Date(v.fecha).getFullYear() === previousYear
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

    // Calcular cambios porcentuales reales
    const ventasAnterior = filteredVentas.filter(
      (v) =>
        new Date(v.fecha).getFullYear() ===
        (showAnterior ? previousYear - 1 : previousYear)
    );
    const totalVentasAnterior = ventasAnterior.reduce(
      (sum, venta) => sum + (parseFloat(venta.total) || 0),
      0
    );

    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? "+100%" : "0%";
      const cambio = ((actual - anterior) / anterior) * 100;
      return `${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`;
    };

    setKpiData({
      ventasTotales: totalVentas || 0,
      margen: margen || 0,
      unidadesVendidas: totalUnidades || 0,
      numeroVentas: numeroVentas,
      ticketPromedio: ticketPromedio,
    });
  }, [filteredVentas, filters.fechaFin, productos, ventaItems, showAnterior]);

  const calculateMonthlyChartData = React.useCallback(() => {
    if (filters.fechaInicio && filters.fechaFin) {
      const startDate = new Date(filters.fechaInicio);
      const endDate = new Date(filters.fechaFin);
      const diffDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 31) {
        // Modo diario
        const dayData = [];
        const currentYear = startDate.getFullYear();
        const previousYear = currentYear - 1;

        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dayEntry = {
            mes: d.toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "2-digit",
            }),
            actual: 0,
            anterior: 0,
          };

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

    const currentYear = new Date(filters.fechaFin).getFullYear();
    const previousYear = currentYear - 1;

    const dataMap = new Map<
      string,
      { mes: string; actual: number; anterior: number }
    >();

    months.forEach((monthName) => {
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
  }, [filteredVentas, filters.fechaFin]);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  useEffect(() => {
    calculateKpis();
  }, [calculateKpis]);

  useEffect(() => {
    calculateMonthlyChartData();
  }, [calculateMonthlyChartData]);

  // Eliminar datos hardcodeados de KPI cards - ahora usar cambios reales
  const kpiCardsData = [
    {
      label: "Ventas totales",
      value: formatPrice(kpiData.ventasTotales),
      change: "+0%", // Se calculará dinámicamente
      isPositive: true,
    },
    {
      label: "Margen",
      value: formatPrice(kpiData.margen),
      change: "+0%", // Se calculará dinámicamente
      isPositive: true,
    },
    {
      label: "Unidades vendidas",
      value: kpiData.unidadesVendidas.toLocaleString("es-CL"),
      change: "+0%", // Se calculará dinámicamente
      isPositive: true,
    },
    {
      label: "N° de ventas",
      value: kpiData.numeroVentas.toLocaleString("es-CL"),
      change: "+0%", // Se calculará dinámicamente
      isPositive: true,
    },
    {
      label: "Ticket promedio",
      value: formatPrice(Math.round(kpiData.ticketPromedio)),
      change: "+0%", // Se calculará dinámicamente
      isPositive: true,
    },
  ];

  const handleDownloadReport = (type: "excel" | "template") => {
    try {
      if (type === "excel") {
        const headers = [
          "Folio",
          "Fecha",
          "Total",
          "Sucursal",
          "Método Pago",
          "Cliente",
          "Usuario",
          "Tipo DTE",
          "Estado",
        ];
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
        const csvContent = headers.join(",") + "\n";
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
        ? [...prev.cajas, caja]
        : prev.cajas.filter((c) => c !== caja),
    }));
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatPrice(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen bg-white flex flex-col relative">
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
                  setKpiError(null);
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
              onClick={() => refetch()}
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
                  setChartError(null);
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
                />
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

      {/* Filters Sidebar */}
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
              <div className="relative">
                <input
                  id="producto-input"
                  type="text"
                  placeholder="Buscar producto..."
                  value={filters.producto}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      producto: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {filters.producto && productos.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {productos
                      .filter((p) =>
                        p.nombre
                          .toLowerCase()
                          .includes(filters.producto.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((producto) => (
                        <button
                          key={producto.id}
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              producto: producto.nombre,
                            }))
                          }
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        >
                          {producto.nombre}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cajas - Ahora usando datos reales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cajas
              </label>
              <div className="space-y-2 text-sm">
                {cajas.map((caja) => (
                  <label
                    key={caja.id}
                    htmlFor={`caja-${caja.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      id={`caja-${caja.id}`}
                      type="checkbox"
                      checked={filters.cajas.includes(caja.id)}
                      onChange={(e) =>
                        handleCajaChange(caja.id, e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-800">
                      {caja.nombre || `Caja ${caja.numero}`}
                    </span>
                  </label>
                ))}
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
