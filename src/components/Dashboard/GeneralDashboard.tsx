import React from "react";  
import { TrendingUp, HelpCircle, Mic } from "lucide-react";  
import { useSupabaseData } from "../../hooks/useSupabaseData";  
import { VoiceSolvIA } from "./VoiceSolvIA";  
import { useAuth } from "../../contexts/AuthContext";  
  
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
          className={`flex items-center space-x-1 text-sm font-medium ${  
            isPositive ? "text-green-600" : "text-red-600"  
          }`}  
        >  
          <TrendingUp className="w-4 h-4" />  
          <span>{change}</span>  
        </div>  
      </div>  
    </div>  
  );  
}  
  
interface DonutChartProps {  
  title: string;  
  data: Array<{  
    name: string;  
    value: number;  
    color: string;  
  }>;  
}  
  
function DonutChart({ title, data }: DonutChartProps) {  
  const total = data.reduce((sum, item) => sum + item.value, 0);  
  let cumulativePercentage = 0;  
  
  return (  
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">  
      <div className="flex items-center justify-between mb-6">  
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>  
        <HelpCircle className="w-4 h-4 text-gray-400" />  
      </div>  
      <div className="flex items-center justify-center mb-6">  
        <div className="relative w-48 h-48">  
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">  
            {data.map((item, index) => {  
              const percentage = total > 0 ? (item.value / total) * 100 : 0;  
              const strokeDasharray = `${percentage} ${100 - percentage}`;  
              const strokeDashoffset = -cumulativePercentage;  
              cumulativePercentage += percentage;  
  
              return (  
                <circle  
                  key={index}  
                  cx="50"  
                  cy="50"  
                  r="35"  
                  fill="transparent"  
                  stroke={item.color}  
                  strokeWidth="12"  
                  strokeDasharray={strokeDasharray}  
                  strokeDashoffset={strokeDashoffset}  
                  className="transition-all duration-300"  
                />  
              );  
            })}  
          </svg>  
        </div>  
      </div>  
      <div className="space-y-3">  
        {data.map((item, index) => (  
          <div  
            key={index}  
            className="flex items-center justify-between text-sm"  
          >  
            <div className="flex items-center space-x-3">  
              <div  
                className="w-4 h-4 rounded-full"  
                style={{ backgroundColor: item.color }}  
              />  
              <span className="text-gray-700 font-medium">{item.name}</span>  
            </div>  
            <span className="font-bold text-gray-900">  
              {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "0%"}  
            </span>  
          </div>  
        ))}  
      </div>  
    </div>  
  );  
}  
  
interface Sucursal {  
  id: string;  
  nombre: string;  
}  
  
export default function GeneralDashboard() {  
  const { empresaId } = useAuth();  
  const [showVoiceChat, setShowVoiceChat] = React.useState(false);  
  const [sucursalId, setSucursalId] = React.useState<string>("");  
  
  // Hook para cargar sucursales de la empresa  
  const [sucursales, setSucursales] = React.useState<Sucursal[]>([]);  
  React.useEffect(() => {  
    if (!empresaId) return;  
    (async () => {  
      const { data, error } = await fetchSucursales(empresaId);  
      if (!error && data) {  
        setSucursales(data);  
      }  
    })();  
  }, [empresaId]);  
  
  // Función para obtener sucursales  
  async function fetchSucursales(  
    empresaId: string  
  ): Promise<{ data: Sucursal[]; error: any }> {  
    try {  
      const { data, error } = await import("../../lib/supabase").then(  
        ({ supabase }) =>  
          supabase  
            .from("sucursales")  
            .select("id, nombre")  
            .eq("empresa_id", empresaId)  
            .order("nombre", { ascending: true })  
      );  
      return { data: data || [], error };  
    } catch (err) {  
      return { data: [], error: err };  
    }  
  }  
  
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
      return [{ name: "Cargando...", value: 0, color: "#6B7280" }];  
    }  
  
    const robo = mermas.filter((m: any) => m.tipo === "robo").length;  
    const vencimiento = mermas.filter((m: any) => m.tipo === "vencimiento").length;  
    const dano = mermas.filter(  
      (m: any) => m.tipo === "daño" || m.tipo === "dano"  
    ).length;  
    const otro = mermas.filter(  
      (m: any) => !["robo", "vencimiento", "daño", "dano"].includes(m.tipo)  
    ).length;  
  
    return [  
      { name: "Robo", value: robo, color: "#EF4444" },  
      { name: "Vencimiento", value: vencimiento, color: "#F59E0B" },  
      { name: "Daño", value: dano, color: "#6B7280" },  
      { name: "Otro", value: otro, color: "#3B82F6" },  
    ];  
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
        >  
          <option value="">Todas las sucursales</option>  
          {sucursales.map((s) => (  
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
  
      {/* Charts */}  
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">  
        <DonutChart  
          title="Asistencias / Inasistencias totales"  
          data={assistanceData}  
        />  
        <DonutChart title="Mermas reportadas" data={lossData} />  
      </div>  
  
      {/* Solo SolvIA Voice Card - Color azul */}  
      <div  
        className="bg-blue-600 text-white p-6 rounded-lg relative overflow-hidden cursor-pointer"  
        onClick={() => setShowVoiceChat(true)}  
      >  
        <div className="relative z-10">  
          <h3 className="text-lg font-semibold mb-2">🎤 ¡Hola, soy SolvIA Voice!</h3>  
          <p className="text-blue-100 mb-4">  
            Tu asistente de voz inteligente. Di "Hola SolvIA" para activarme.  
          </p>  
        </div>  
        <div className="absolute bottom-4 right-4">  
          <div className="w-12 h-12 bg-black bg-opacity-20 rounded-full flex items-center justify-center">  
            <Mic className="w-6 h-6" />  
          </div>  
        </div>  
      </div>  
  
      {/* Solo Modal de Voice */}  
      <VoiceSolvIA isOpen={showVoiceChat} onClose={() => setShowVoiceChat(false)} />  
    </div>  
  );  
}