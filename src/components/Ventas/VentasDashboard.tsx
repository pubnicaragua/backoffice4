import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Calendar as CalendarIcon,
  X as XIcon,
  Loader2,
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
} from "recharts";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricsCard({ label, value, change, isPositive }: KpiCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
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

interface Venta {
  id: string;
  fecha: string;
  total: string | number;
  sucursal_id?: string;
  sucursales?: { nombre: string };
  metodo_pago: string;
  producto?: string;
  venta_id?: string;
  tipo_dte?: string;
}

interface VentaItem {
  id: string;
  cantidad: number;
  producto_id: string;
  producto?: { nombre: string; costo: number };
  venta_id?: string;
}

interface Producto {
  id: string;
  nombre: string;
  costo: number;
}

interface Sucursal {
  id: string;
  nombre: string;
}

interface FilterState {
  fechaInicio: string;
  fechaFin: string;
  sucursal: string;
  metodo_pago: string;
  producto: string;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(
    n
  );

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }}>
            {`${entry.name}: ${formatPrice(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function VentasDashboard() {
  const { empresaId } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    fechaInicio: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    sucursal: "",
    metodo_pago: "",
    producto: "",
  });
  const [monthlyChartData, setMonthlyChartData] = useState<
    Array<{ mes: string; actual: number }>
  >([]);
  const [kpiData, setKpiData] = useState({
    ventasTotales: 0,
    margen: 0,
    unidadesVendidas: 0,
    numeroVentas: 0,
    ticketPromedio: 0,
  });
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const { data: ventas = [] } = useSupabaseData<Venta>(
    "ventas",
    "*, sucursales(nombre)",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: ventaItems = [] } = useSupabaseData<VentaItem>(
    "venta_items",
    "*, productos(nombre, costo), ventas!inner(empresa_id)",
    empresaId ? { "ventas.empresa_id": empresaId } : undefined
  );

  const { data: productos = [] } = useSupabaseData<Producto>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  useEffect(() => {
    if (!empresaId) return;
    supabase
      .from("sucursales")
      .select("id, nombre")
      .eq("empresa_id", empresaId)
      .order("nombre", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setSucursales(data);
      });
  }, [empresaId]);

  const filteredVentas = React.useMemo(() => {
    return ventas.filter((venta) => {
      if (
        filters.fechaInicio &&
        new Date(venta.fecha) < new Date(filters.fechaInicio)
      )
        return false;
      if (
        filters.fechaFin &&
        new Date(venta.fecha) > new Date(filters.fechaFin)
      )
        return false;
      if (filters.sucursal && venta.sucursal_id !== filters.sucursal)
        return false;
      if (filters.metodo_pago && venta.metodo_pago !== filters.metodo_pago)
        return false;

      if (filters.producto) {
        const prodFilter = filters.producto.toLowerCase();
        const items = ventaItems.filter(
          (item) =>
            item.venta_id === venta.id &&
            item.producto?.nombre.toLowerCase().includes(prodFilter)
        );
        if (items.length === 0) return false;
      }
      return true;
    });
  }, [ventas, ventaItems, filters]);

  const calculateKpis = useCallback(() => {
    try {
      setLoadingKpis(true);
      setKpiError(null);

      const totalVentas = filteredVentas.reduce(
        (sum, v) =>
          sum + (typeof v.total === "string" ? parseFloat(v.total) : v.total),
        0
      );

      const numeroVentas = filteredVentas.length;

      const totalUnidades = ventaItems
        .filter((item) => filteredVentas.some((v) => v.id === item.venta_id))
        .reduce((sum, item) => sum + (item.cantidad || 0), 0);

      const ticketPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0;

      const totalCosto = ventaItems
        .filter((item) => filteredVentas.some((v) => v.id === item.venta_id))
        .reduce((sum, item) => {
          const prod = productos.find((p) => p.id === item.producto_id);
          return sum + (prod?.costo ?? 0) * (item.cantidad ?? 0);
        }, 0);

      const margen = totalVentas - totalCosto;

      setKpiData((prev) => {
        if (
          prev.ventasTotales === totalVentas &&
          prev.margen === margen &&
          prev.unidadesVendidas === totalUnidades &&
          prev.numeroVentas === numeroVentas &&
          prev.ticketPromedio === ticketPromedio
        )
          return prev;
        return {
          ventasTotales: totalVentas,
          margen,
          unidadesVendidas: totalUnidades,
          numeroVentas,
          ticketPromedio,
        };
      });
    } catch {
      setKpiError("Error calculando KPIs");
    } finally {
      setLoadingKpis(false);
    }
  }, [filteredVentas, ventaItems, productos]);

  const calculateMonthlyChartData = useCallback(() => {
    try {
      setLoadingChart(true);
      setChartError(null);
      if (!(filters.fechaInicio && filters.fechaFin)) {
        setMonthlyChartData([]);
        setLoadingChart(false);
        return;
      }
      const startDate = new Date(filters.fechaInicio);
      const endDate = new Date(filters.fechaFin);
      const dayMap = new Map<string, number>();

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dayMap.set(d.toISOString().slice(0, 10), 0);
      }

      filteredVentas.forEach((venta) => {
        const ventaDateStr = venta.fecha.slice(0, 10);
        if (dayMap.has(ventaDateStr)) {
          dayMap.set(
            ventaDateStr,
            dayMap.get(ventaDateStr)! +
              (typeof venta.total === "string"
                ? parseFloat(venta.total)
                : venta.total)
          );
        }
      });

      const chartData = Array.from(dayMap.entries()).map(([key, value]) => {
        const date = new Date(key);
        const mes = date.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        });
        return { mes, actual: value };
      });

      setMonthlyChartData((prev) => {
        if (
          prev.length === chartData.length &&
          prev.every(
            (item, idx) =>
              item.mes === chartData[idx].mes &&
              item.actual === chartData[idx].actual
          )
        )
          return prev;
        return chartData;
      });
    } catch {
      setChartError("Error calculando datos del gráfico");
    } finally {
      setLoadingChart(false);
    }
  }, [filteredVentas, filters.fechaInicio, filters.fechaFin]);

  useEffect(() => {
    calculateKpis();
  }, [calculateKpis]);

  useEffect(() => {
    calculateMonthlyChartData();
  }, [calculateMonthlyChartData]);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col relative">
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
            onClick={() => {
              try {
                const headers = [
                  "Folio",
                  "Fecha",
                  "Total",
                  "Sucursal",
                  "Método Pago",
                  "Producto",
                ];
                const csvContent = [
                  headers.join(","),
                  ...filteredVentas.map((v) =>
                    [
                      `"${v.id}"`,
                      `"${new Date(v.fecha).toLocaleDateString("es-CL")}"`,
                      `"${v.total}"`,
                      `"${v.sucursales?.nombre || "N/A"}"`,
                      `"${v.metodo_pago || "N/A"}"`,
                      `"${filters.producto || "-"}"`,
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
              } catch {
                toast.error("Error al descargar el reporte.");
              }
            }}
            className="group flex flex-col items-center text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-lg hover:bg-blue-50 text-center"
            title="Descargar Excel"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] mt-1">Excel</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="text-center">
              <div className="font-medium">
                {currentTime.toLocaleTimeString("es-CL")}
              </div>
            </div>
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
                  autoComplete="off"
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
                          tabIndex={-1}
                        >
                          {producto.nombre}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

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
              type="button"
            >
              {(loadingKpis || loadingChart) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Aplicar filtros
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 space-y-6 overflow-auto">
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
                type="button"
              >
                <Loader2 className="w-4 h-4 mr-1" /> Reintentar
              </button>
            </div>
          ) : (
            <>
              {[
                {
                  label: "Ventas totales",
                  value: formatPrice(kpiData.ventasTotales),
                  change: "+0%",
                  isPositive: true,
                },
                {
                  label: "Margen",
                  value: formatPrice(kpiData.margen),
                  change: "+0%",
                  isPositive: true,
                },
                {
                  label: "Unidades vendidas",
                  value: kpiData.unidadesVendidas.toLocaleString("es-CL"),
                  change: "+0%",
                  isPositive: true,
                },
                {
                  label: "N° de ventas",
                  value: kpiData.numeroVentas.toLocaleString("es-CL"),
                  change: "+0%",
                  isPositive: true,
                },
                {
                  label: "Ticket promedio",
                  value: formatPrice(Math.round(kpiData.ticketPromedio)),
                  change: "+0%",
                  isPositive: true,
                },
              ].map((kpi, idx) => (
                <MetricsCard key={idx} {...kpi} />
              ))}
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ventas totales por mes
          </h3>

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
                type="button"
              >
                <Loader2 className="w-4 h-4 mr-1" /> Reintentar
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
                  tickFormatter={formatPrice}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  dot={false}
                  name="Período seleccionado"
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
