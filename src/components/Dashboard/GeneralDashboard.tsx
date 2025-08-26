import React from "react";
import { TrendingUp, HelpCircle } from "lucide-react";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";
import { Sucursal } from "../../types/cajas";

interface MetricsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricsCard({ title, value, change, isPositive }: MetricsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div
          className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{change}</span>
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
              y="46"
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

  // Hook para cargar sucursales de la empresa  
  const { data: sucursales, error: sucursalesError } = useSupabaseData<Sucursal>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Construir filtro común para las consultas según empresaId y sucursalId  
  const commonFilter = React.useMemo(() => {
    if (!empresaId) return undefined;
    if (sucursalId) return { empresa_id: empresaId, sucursal_id: sucursalId };
    return { empresa_id: empresaId };
  }, [empresaId, sucursalId]);

  const { data: ventas, loading: ventasLoading } = useSupabaseData<any>(
    "ventas",
    "*",
    commonFilter
  );

  const { data: ventaItems } = useSupabaseData<any>(
    "venta_items",
    "*, ventas!inner(empresa_id)",
    commonFilter ? { "ventas.empresa_id": commonFilter.empresa_id } : undefined
  );

  const { data: asistencias, loading: asistenciasLoading } =
    useSupabaseData<any>("asistencias", "*", commonFilter);

  const { data: mermas, loading: mermasLoading } = useSupabaseData<any>(
    "mermas",
    "*",
    commonFilter
  );

  const { data: productos } = useSupabaseData<any>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

  const calculateMetrics = () => {
    if (ventasLoading || !ventas) return null;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const ventasActuales = ventas.filter((v: any) => {
      const ventaDate = new Date(v.fecha);
      return (
        ventaDate.getMonth() === currentMonth &&
        ventaDate.getFullYear() === currentYear
      );
    });

    const ventasAnteriores = ventas.filter((v: any) => {
      const ventaDate = new Date(v.fecha);
      return (
        ventaDate.getMonth() === previousMonth &&
        ventaDate.getFullYear() === previousYear
      );
    });

    const totalVentasActual = ventasActuales.reduce(
      (sum: number, venta: any) => sum + (parseFloat(venta.total) || 0),
      0
    );
    const totalVentasAnterior = ventasAnteriores.reduce(
      (sum: number, venta: any) => sum + (parseFloat(venta.total) || 0),
      0
    );

    const totalUnidades =
      ventaItems?.reduce((sum: number, item: any) => sum + (item.cantidad || 0), 0) || 0;
    const numeroVentas = ventasActuales.length;
    const ticketPromedio =
      numeroVentas > 0 ? totalVentasActual / numeroVentas : 0;

    const totalCosto =
      ventaItems?.reduce((sum: number, item: any) => {
        const producto = productos?.find((p: any) => p.id === item.producto_id);
        return sum + (producto?.costo || 0) * item.cantidad;
      }, 0) || 0;
    const margen = totalVentasActual - totalCosto;

    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? "+100%" : "0%";
      const cambio = ((actual - anterior) / anterior) * 100;
      return `${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`;
    };

    return {
      ventasTotales: totalVentasActual,
      margen: margen,
      unidadesVendidas: totalUnidades,
      numeroVentas: numeroVentas,
      ticketPromedio: ticketPromedio,
      cambioVentas: calcularCambio(totalVentasActual, totalVentasAnterior),
      cambioMargen: calcularCambio(margen, totalVentasAnterior - totalCosto),
      cambioUnidades: calcularCambio(totalUnidades, 0),
      cambioNumeroVentas: calcularCambio(numeroVentas, ventasAnteriores.length),
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
    if (!asistencias || asistenciasLoading) {
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
    if (!mermas || mermasLoading) {
      return [{ name: "Sin datos", value: 1, color: "#E5E7EB" }];
    }

    const robo = mermas.filter((m: any) => m.tipo === "robo").length;
    const vencimiento = mermas.filter((m: any) => m.tipo === "vencimiento").length;
    const dano = mermas.filter(
      (m: any) => m.tipo === "daño" || m.tipo === "dano"
    ).length;
    const otro = mermas.filter(
      (m: any) => !["robo", "vencimiento", "daño", "dano"].includes(m.tipo)
    ).length;

    if (!mermas || mermasLoading) {
      return [{ name: "Sin datos", value: 0, color: "#E5E7EB" }];
    }

    // ✅ Si no hay datos reales
    if (robo === 0 && vencimiento === 0 && dano === 0 && otro === 0) {
      return [{ name: "Sin mermas reportadas", value: 0, color: "#E5E7EB" }];
    }

    return [
      { name: "Robo", value: robo, color: "#EF4444" },
      { name: "Vencimiento", value: vencimiento, color: "#F59E0B" },
      { name: "Daño", value: dano, color: "#6B7280" },
      { name: "Otro", value: otro, color: "#3B82F6" },
    ].filter(item => item.value > 0); // Solo mostrar categorías con datos  
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
        {metricsData.map((metric, index) => (
          <MetricsCard key={index} {...metric} />
        ))}
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
