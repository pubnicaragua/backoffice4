import React, { useCallback, useEffect, useState } from "react";
import { TrendingUp, HelpCircle, TrendingDown, Loader2 } from "lucide-react";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";
import { Sucursal } from "../../types/cajas";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";

interface MetricsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}


function MetricsCard({ title, value, change, isPositive }: MetricsCardProps) {
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
          {value !== "0" && value !== "$0" ? (
            isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )
          ) : (
            <span>-</span>
          )}

          <span>{value !== "0" && value !== "$0" ? change : ""}</span>
        </div>
      </div>
    </div>
  );
}


interface PieChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

// ✅ Gráfico de Pastel Súper Dinámico y Atractivo  
function PieChart({ title, data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const defaultData = [{ name: "Sin datos", value: 1, color: "#E5E7EB" }];
  const chartData = total > 0 ? data : defaultData;
  const hasData = total > 0;

  // ✅ Calcular ángulos y crear slices animados  
  const calculateSlices = () => {
    let currentAngle = 0;
    return chartData.map((item, index) => {
      const percentage = hasData ? (item.value / total) * 100 : 100;
      const angle = (percentage / 100) * 360;
      const slice = {
        ...item,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        largeArcFlag: angle > 180 ? 1 : 0,
        index
      };
      currentAngle += angle;
      return slice;
    });
  };

  const slices = calculateSlices();

  // ✅ Crear path SVG para cada slice con animación  
  const createSlicePath = (slice: any, isHovered: boolean = false) => {
    const centerX = 50;
    const centerY = 50;
    const radius = isHovered ? 38 : 35; // Efecto hover  
    const startAngleRad = (slice.startAngle * Math.PI) / 180;
    const endAngleRad = (slice.endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${slice.largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const [hoveredSlice, setHoveredSlice] = React.useState<number | null>(null);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-56 h-56">
          {/* ✅ SVG con animaciones y efectos hover */}
          <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 100 100">
            {/* Círculo de fondo sutil */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="0.5"
              className="opacity-30"
            />

            {/* Slices del gráfico */}
            {slices.map((slice, index) => (
              <g key={index}>
                {/* Slice principal */}
                <path
                  d={createSlicePath(slice, hoveredSlice === index)}
                  fill={slice.color}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: hasData ?
                      hoveredSlice === index ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.15))' :
                        hoveredSlice !== null && hoveredSlice !== index ? 'brightness(0.9)' : 'none'
                      : 'grayscale(100%)',
                    transformOrigin: '50% 50%',
                  }}
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />

                {/* Efecto de brillo en hover */}
                {hoveredSlice === index && hasData && (
                  <path
                    d={createSlicePath(slice, true)}
                    fill="url(#shine-gradient)"
                    className="opacity-20 pointer-events-none"
                  />
                )}
              </g>
            ))}

            {/* Gradiente para efecto de brillo */}
            <defs>
              <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* ✅ Círculo central con efecto donut mejorado */}
            <circle
              cx="50"
              cy="50"
              r="18"
              fill="white"
              className="drop-shadow-lg"
            />

            {/* ✅ Texto central con total y animación */}
            <text
              x="50"
              y="39"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pb-3 text-sm font-bold fill-gray-800"
              transform="rotate(90 50 50)"
            >
              {hasData ? total : "0"}
            </text>
            <text
              x="50"
              y="54"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-500"
              transform="rotate(90 50 50)"
            >
              Total
            </text>
          </svg>

          {/* ✅ Tooltip flotante en hover */}
          {hoveredSlice !== null && hasData && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
                {slices[hoveredSlice].name}: {slices[hoveredSlice].value} ({slices[hoveredSlice].percentage.toFixed(1)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Leyenda mejorada con animaciones */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between text-sm p-2 rounded-lg transition-all duration-200 ${hoveredSlice === index ? 'bg-gray-50 scale-105' : 'hover:bg-gray-50'
              }`}
            onMouseEnter={() => setHoveredSlice(index)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-200 ${hoveredSlice === index ? 'scale-125 shadow-md' : ''
                  }`}
                style={{ backgroundColor: item.color }}
              />
              <span className={`font-medium transition-colors ${hasData ? 'text-gray-700' : 'text-gray-400'
                } ${hoveredSlice === index ? 'text-gray-900' : ''}`}>
                {item.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold transition-colors ${hasData ? 'text-gray-900' : 'text-gray-400'
                } ${hoveredSlice === index ? 'text-blue-600' : ''}`}>
                {hasData ? item.value : "0"}
              </span>
              <span className={`text-xs transition-colors ${hasData ? 'text-gray-500' : 'text-gray-400'
                } ${hoveredSlice === index ? 'text-blue-500' : ''}`}>
                ({hasData ? `${((item.value / total) * 100).toFixed(1)}%` : "0%"})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Mensaje cuando no hay datos */}
      {!hasData && (
        <div className="mt-4 text-center p-6 bg-gray-50 rounded-lg flex flex-col items-center gap-6">
          <p className="text-sm text-gray-500">
            No hay datos disponibles para mostrar
          </p>
          <p className="text-xs text-gray-400">
            Los datos aparecerán aquí cuando estén disponibles
          </p>
        </div>
      )}

      {/* ✅ Indicador de carga animado */}
      {hasData && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneralDashboard() {
  const { empresaId } = useAuth();
  const [sucursalId, setSucursalId] = React.useState<string>("");
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventaItems, setVentaItems] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [mermas, setMermas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hook para cargar sucursales de la empresa  
  const getSucursales = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("sucursales")
        .select("*")
        .eq("empresa_id", empresaId);

      if (error) {
        toast.error("Error al obtener las sucursales");
        return;
      }

      setSucursales(data);
    } catch (e) {
      console.error("Error al obtener sucursales:", e);
      toast.error("Error al obtener las sucursales");
    }
  }, [empresaId]);

  useEffect(() => {
    getSucursales();
  }, [getSucursales]);

  // Construir filtro común para las consultas según empresaId y sucursalId  
  const commonFilter = React.useMemo(() => {
    if (!empresaId) return undefined;
    if (sucursalId) return { empresa_id: empresaId, sucursal_id: sucursalId };
    return { empresa_id: empresaId };
  }, [empresaId, sucursalId]);

  const getVentas = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("ventas")
        .select("*")
        .match(commonFilter!);

      if (error) {
        toast.error("Error al obtener ventas");
        return;
      }

      setVentas(data || []);
    } catch (err) {
      console.error("Error al obtener ventas:", err);
      toast.error("Error al obtener ventas");
    }
  }, [empresaId, sucursalId]);

  // Venta items
  const getVentaItems = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("venta_items")
        .select("*, ventas!inner(empresa_id)")
        .eq("ventas.empresa_id", empresaId);

      if (error) {
        toast.error("Error al obtener items de ventas");
        return;
      }

      setVentaItems(data || []);
    } catch (err) {
      console.error("Error al obtener items de ventas:", err);
      toast.error("Error al obtener items de ventas");
    }
  }, [empresaId]);

  // Asistencias
  const getAsistencias = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("asistencias")
        .select("*")
        .match(commonFilter!);

      if (error) {
        toast.error("Error al obtener asistencias");
        return;
      }

      setAsistencias(data || []);
    } catch (err) {
      console.error("Error al obtener asistencias:", err);
      toast.error("Error al obtener asistencias");
    }
  }, [empresaId, sucursalId]);

  // Mermas
  const getMermas = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("mermas")
        .select("*")
        .match(commonFilter!);

      if (error) {
        toast.error("Error al obtener mermas");
        return;
      }

      setMermas(data || []);
    } catch (err) {
      console.error("Error al obtener mermas:", err);
      toast.error("Error al obtener mermas");
    }
  }, [empresaId, sucursalId]);

  // Productos
  const getProductos = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("empresa_id", empresaId);

      if (error) {
        toast.error("Error al obtener productos");
        return;
      }

      setProductos(data || []);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      toast.error("Error al obtener productos");
    }
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return;

    setLoading(true);
    Promise.all([
      getVentas(),
      getVentaItems(),
      getAsistencias(),
      getMermas(),
      getProductos(),
    ]).finally(() => setLoading(false));
  }, [empresaId, sucursalId, getVentas, getVentaItems, getAsistencias, getMermas, getProductos]);

  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

  const calculateMetrics = () => {
    if (loading || !ventas) {
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

    const ventaItemsActuales = ventaItems?.filter((item: any) =>
      ventasActuales.some((v: any) => v.id === item.venta_id)
    ) || [];

    const ventaItemsAnteriores = ventaItems?.filter((item: any) =>
      ventasAnteriores.some((v: any) => v.id === item.venta_id)
    ) || [];

    // Totales de ventas
    const totalVentasActual = ventasActuales.reduce(
      (sum: number, venta: any) => sum + (parseFloat(venta.total) || 0),
      0
    );
    const totalVentasAnterior = ventasAnteriores.reduce(
      (sum: number, venta: any) => sum + (parseFloat(venta.total) || 0),
      0
    );

    // Unidades vendidas (⚠️ ojo, no filtra por mes)
    const totalUnidades = ventaItemsActuales.reduce(
      (sum: number, item: any) => sum + (item.cantidad || 0),
      0
    );


    // Número de ventas y ticket promedio
    const numeroVentas = ventasActuales.length;
    const ticketPromedio =
      numeroVentas > 0 ? totalVentasActual / numeroVentas : 0;


    // Filtrar el costo por mes
    const totalCosto = ventaItemsActuales.reduce((sum: number, item: any) => {
      const producto = productos?.find((p: any) => p.id === item.producto_id);
      return sum + (producto?.costo || 0) * item.cantidad;
    }, 0);


    const costoAnterior = ventaItemsAnteriores.reduce((sum: number, item: any) => {
      const producto = productos?.find((p: any) => p.id === item.producto_id);
      return sum + (producto?.costo || 0) * item.cantidad;
    }, 0);

    const margenAnterior = totalVentasAnterior - costoAnterior;

    const margen = totalVentasActual - totalCosto;

    // Aux para cambios
    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) {
        if (actual > 0) return "+100%";
        return "0%"; // ambos son 0
      }
      const cambio = ((actual - anterior) / anterior) * 100;
      return `${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`;
    };

    // Resultado final con logs
    const result = {
      ventasTotales: totalVentasActual,
      margen: margen,
      unidadesVendidas: totalUnidades,
      numeroVentas: numeroVentas,
      ticketPromedio: ticketPromedio,
      cambioVentas: calcularCambio(totalVentasActual, totalVentasAnterior),
      cambioMargen: calcularCambio(margen, margenAnterior),
      cambioUnidades: calcularCambio(totalUnidades, 0),
      cambioNumeroVentas: calcularCambio(numeroVentas, ventasAnteriores.length),
      cambioTicket: calcularCambio(
        ticketPromedio,
        ventasAnteriores.length > 0
          ? totalVentasAnterior / ventasAnteriores.length
          : 0
      ),
    };

    return result;
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
        value: `$${Math.round(metrics.ticketPromedio).toLocaleString("es-CL")}`,
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

  const processAttendanceData = () => {
    if (!asistencias || loading) {
      return [{ name: "Cargando...", value: 0, color: "#6B7280" }];
    }

    const presentes = asistencias.filter((a: any) => a.estado === "presente").length;
    const ausentes = asistencias.filter((a: any) => a.estado === "ausente").length;
    const tardes = asistencias.filter((a: any) => a.estado === "tarde").length;
    const justificados = asistencias.filter(
      (a: any) => a.estado === "justificado"
    ).length;

    return [
      { name: "Presente", value: presentes, color: "#10B981" },
      { name: "Ausente", value: ausentes, color: "#EF4444" },
      { name: "Tarde", value: tardes, color: "#F59E0B" },
      { name: "Justificado", value: justificados, color: "#6B7280" },
    ];
  };

  const processLossData = () => {
    if (!mermas || loading) {
      // Estado de carga
      return [{ name: "Cargando...", value: 1, color: "#E5E7EB" }];
    }

    const robo = mermas.filter((m: any) => m.tipo === "robo").length;
    const vencimiento = mermas.filter((m: any) => m.tipo === "vencimiento").length;
    const dano = mermas.filter((m: any) => m.tipo === "daño" || m.tipo === "dano").length;
    const otro = mermas.filter(
      (m: any) => !["robo", "vencimiento", "daño", "dano"].includes(m.tipo)
    ).length;

    // ✅ Si no hay datos reales
    if (robo === 0 && vencimiento === 0 && dano === 0 && otro === 0) {
      return [{ name: "Sin mermas reportadas", value: 0, color: "#E5E7EB", isEmpty: true }];
    }

    // ✅ Retornar solo categorías con datos
    return [
      { name: "Robo", value: robo, color: "#EF4444" },
      { name: "Vencimiento", value: vencimiento, color: "#F59E0B" },
      { name: "Daño", value: dano, color: "#6B7280" },
      { name: "Otro", value: otro, color: "#3B82F6" },
    ].filter(item => item.value > 0);
  };

  const assistanceData = processAttendanceData();
  const lossData = processLossData();

  return (
    <div className="p-6 space-y-6">
      {/* Selector sucursal */}
      <div className="mb-4 max-w-xs">
        <label
          htmlFor="sucursal-select"
          className="block mb-1 font-medium text-gray-700"
        >
          Filtrar por Sucursal
        </label>
        <select
          id="sucursal-select"
          value={sucursalId}
          onChange={(e) => setSucursalId(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          disabled={!sucursales || sucursales.length === 0}
        >
          <option value="">Todas las sucursales</option>
          {sucursales?.map((s: Sucursal) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
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
                calculateMetrics();
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

      {/* Charts - Gráficos de Pastel Dinámicos Mejorados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          title="Asistencias / Inasistencias totales"
          data={assistanceData}
        />
        <PieChart title="Mermas reportadas" data={lossData} />
      </div>
    </div>
  );
}
