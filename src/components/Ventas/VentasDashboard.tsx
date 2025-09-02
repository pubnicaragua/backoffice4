import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Calendar as CalendarIcon,
  X as XIcon,
  Loader2,
  TrendingUp,
  HelpCircle,
  TrendingDown,
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
import { toast } from "react-toastify";

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricsCard({ title, value, change, isPositive }: KpiCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Título con icono de ayuda */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </div>

      {/* Valor principal y tendencia */}
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div
          className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"
            }`}
        >
          {value !== "0" ? (
            isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )
          ) : (
            <span>-</span>
          )}
          <span>{value !== "0" ? change : ""}</span>
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
  movimiento: string; // Nuevo filtro  
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

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
    movimiento: "",
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
    changes: {
      ventasTotales: 0,
      margen: 0,
      unidadesVendidas: 0,
      numeroVentas: 0,
      ticketPromedio: 0,
    },
  });

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [productosConMovimiento, setProductosConMovimiento] = useState<
    Array<{ id: string; nombre: string; totalVendido: number; tipo: string }>
  >([]);

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

  // Calcular movimiento de productos  
  useEffect(() => {
    if (productos.length > 0 && ventaItems.length > 0) {
      const movimientos = productos.map((producto) => {
        const ventasProducto = ventaItems.filter(
          (item) => item.producto_id === producto.id
        );
        const totalVendido = ventasProducto.reduce(
          (sum, item) => sum + item.cantidad,
          0
        );

        let tipo = "Sin movimiento";
        if (totalVendido >= 50) {
          tipo = "Mucho movimiento";
        } else if (totalVendido >= 10) {
          tipo = "Movimiento medio";
        } else if (totalVendido > 0) {
          tipo = "Poco movimiento";
        }

        return {
          id: producto.id,
          nombre: producto.nombre,
          totalVendido,
          tipo,
        };
      });

      setProductosConMovimiento(movimientos);
    }
  }, [productos, ventaItems, ventas]);

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

  const calcularMovimientoProducto = (
    productoId: string
  ): { cantidad: number; tipo: string } => {
    const ventasProducto = ventaItems.filter(
      (item) => item.producto_id === productoId
    );
    const totalVendido = ventasProducto.reduce(
      (sum, item) => sum + item.cantidad,
      0
    );

    // Clasificar movimiento basado en ventas de los últimos 30 días
    let tipo = "Sin movimiento";
    if (totalVendido >= 50) {
      tipo = "Mucho movimiento";
    } else if (totalVendido >= 10) {
      tipo = "Movimiento medio";
    } else if (totalVendido > 0) {
      tipo = "Poco movimiento";
    }

    return { cantidad: totalVendido, tipo };
  };

  const filteredVentas = React.useMemo(() => {
    const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : null;
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : null;

    // Ajustar fechaFinal para incluir todo el día (hora 23:59:59)
    if (fechaFin) {
      fechaFin.setHours(23, 59, 59, 999);
    }

    return ventas.filter((venta) => {
      const ventaFecha = new Date(venta.fecha);
      if (fechaInicio && ventaFecha < fechaInicio) return false;
      if (fechaFin && ventaFecha > fechaFin) return false;

      // Otros filtros
      if (filters.sucursal && venta.sucursal_id !== filters.sucursal) return false;
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

      // Filtro por movimiento de productos
      if (filters.movimiento) {
        const items = ventaItems.filter((item) => item.venta_id === venta.id);

        const cumpleMovimiento = items.some((item) => {
          const movimiento = calcularMovimientoProducto(item.producto_id);

          if (filters.movimiento === "mucho" && movimiento.tipo !== "Mucho movimiento")
            return false;
          if (filters.movimiento === "poco" && movimiento.tipo !== "Poco movimiento")
            return false;
          if (filters.movimiento === "sin" && movimiento.tipo !== "Sin movimiento")
            return false;

          return true;
        });

        if (!cumpleMovimiento) return false;
      }

      return true;
    });
  }, [ventas, ventaItems, filters]);

  const calculateMetrics = () => {
    if (loadingKpis || !ventas) {
      return null;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Ventas del mes actual
    const ventasActuales = ventas.filter((v: any) => {
      const ventaDate = new Date(v.fecha);
      return (
        ventaDate.getMonth() === currentMonth &&
        ventaDate.getFullYear() === currentYear
      );
    });

    // Ventas del mes anterior
    const ventasAnteriores = ventas.filter((v: any) => {
      const ventaDate = new Date(v.fecha);
      return (
        ventaDate.getMonth() === previousMonth &&
        ventaDate.getFullYear() === previousYear
      );
    });

    // Items por mes
    const ventaItemsActuales =
      ventaItems?.filter((item: any) =>
        ventasActuales.some((v: any) => v.id === item.venta_id)
      ) || [];

    const ventaItemsAnteriores =
      ventaItems?.filter((item: any) =>
        ventasAnteriores.some((v: any) => v.id === item.venta_id)
      ) || [];

    // Totales
    const totalVentasActual = ventasActuales.reduce(
      (sum: number, v: any) => sum + (parseFloat(v.total) || 0),
      0
    );
    const totalVentasAnterior = ventasAnteriores.reduce(
      (sum: number, v: any) => sum + (parseFloat(v.total) || 0),
      0
    );

    const totalUnidades = ventaItemsActuales.reduce(
      (sum: number, i: any) => sum + (i.cantidad || 0),
      0
    );

    const numeroVentas = ventasActuales.length;
    const ticketPromedio =
      numeroVentas > 0 ? totalVentasActual / numeroVentas : 0;

    // Costo y margen
    const totalCosto = ventaItemsActuales.reduce((sum: number, i: any) => {
      const producto = productos?.find((p: any) => p.id === i.producto_id);
      return sum + (producto?.costo || 0) * i.cantidad;
    }, 0);

    const costoAnterior = ventaItemsAnteriores.reduce((sum: number, i: any) => {
      const producto = productos?.find((p: any) => p.id === i.producto_id);
      return sum + (producto?.costo || 0) * i.cantidad;
    }, 0);

    const margen = totalVentasActual - totalCosto;
    const margenAnterior = totalVentasAnterior - costoAnterior;

    // Aux para cambios
    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) {
        if (actual > 0) return "+100%";
        return "0%";
      }
      const cambio = ((actual - anterior) / anterior) * 100;
      return `${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`;
    };

    return {
      ventasTotales: totalVentasActual,
      margen,
      unidadesVendidas: totalUnidades,
      numeroVentas,
      ticketPromedio,
      cambioVentas: calcularCambio(totalVentasActual, totalVentasAnterior),
      cambioMargen: calcularCambio(margen, margenAnterior),
      cambioUnidades: calcularCambio(totalUnidades, 0),
      cambioNumeroVentas: calcularCambio(
        numeroVentas,
        ventasAnteriores.length
      ),
      cambioTicket: calcularCambio(
        ticketPromedio,
        ventasAnteriores.length > 0
          ? totalVentasAnterior / ventasAnteriores.length
          : 0
      ),
    };
  };

  const metrics = calculateMetrics();

  const metricsData = metrics
    ? [
      {
        title: "Ventas totales",
        value: `$${metrics.ventasTotales.toLocaleString("es-CL")}`,
        change: metrics.cambioVentas,
        isPositive: !metrics.cambioVentas.startsWith("-"),
      },
      {
        title: "Margen",
        value: `$${metrics.margen.toLocaleString("es-CL")}`,
        change: metrics.cambioMargen,
        isPositive: !metrics.cambioMargen.startsWith("-"),
      },
      {
        title: "Unidades vendidas",
        value: metrics.unidadesVendidas.toLocaleString("es-CL"),
        change: metrics.cambioUnidades,
        isPositive: !metrics.cambioUnidades.startsWith("-"),
      },
      {
        title: "N° de ventas",
        value: metrics.numeroVentas.toLocaleString("es-CL"),
        change: metrics.cambioNumeroVentas,
        isPositive: !metrics.cambioNumeroVentas.startsWith("-"),
      },
      {
        title: "Ticket promedio",
        value: `$${Math.round(metrics.ticketPromedio).toLocaleString(
          "es-CL"
        )}`,
        change: metrics.cambioTicket,
        isPositive: !metrics.cambioTicket.startsWith("-"),
      },
    ]
    : Array(5).fill({
      title: "Cargando...",
      value: "$0",
      change: "+0%",
      isPositive: true,
    });

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

      // Ajustar inicio y fin
      const adjustedStart = new Date(startDate);
      adjustedStart.setHours(0, 0, 0, 0);

      const adjustedEnd = new Date(endDate);
      adjustedEnd.setHours(23, 59, 59, 999);

      const dayMap = new Map<string, number>();

      // Crear mapa de días
      for (let d = new Date(adjustedStart); d <= adjustedEnd; d.setDate(d.getDate() + 1)) {
        dayMap.set(d.toISOString().slice(0, 10), 0);
      }

      filteredVentas.forEach((venta) => {
        const ventaFecha = new Date(venta.fecha);
        const ventaFechaStr = ventaFecha.toISOString().slice(0, 10);

        if (dayMap.has(ventaFechaStr)) {
          dayMap.set(
            ventaFechaStr,
            dayMap.get(ventaFechaStr)! +
            (typeof venta.total === "string" ? parseFloat(venta.total) : venta.total)
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
              item.mes === chartData[idx].mes && item.actual === chartData[idx].actual
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
    calculateMetrics();
  }, [filteredVentas, ventaItems, productos]);

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
                const csvContent = "\uFEFF" + [
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
                a.download = `reporte_ventas_${new Date().toISOString().split("T")[0]
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
                htmlFor="movimiento-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Movimiento de Productos
              </label>
              <select
                id="movimiento-select"
                value={filters.movimiento}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    movimiento: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los movimientos</option>
                <option value="mucho">Mucho movimiento (50+ ventas)</option>
                <option value="poco">Poco movimiento (1-9 ventas)</option>
                <option value="sin">Sin movimiento (0 ventas)</option>
              </select>
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
              {metricsData.map((m, idx) => (
                <MetricsCard key={idx} {...m} />
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
                  tickFormatter={formatPrice} axisLine={false}
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