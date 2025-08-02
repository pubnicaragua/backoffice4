import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Download, 
  Filter, 
  HelpCircle, 
  RefreshCw, 
  X as XIcon,
  Calendar as CalendarIcon,
  BarChart3
} from "lucide-react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Line,
  CartesianGrid,
  Brush,
  ComposedChart
} from "recharts";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

// KPI Card component interface
interface KpiCardProps {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

// KPI Data type
type KpiData = {
  ventasTotales: number;
  margen: number;
  unidadesVendidas: number;
  numeroVentas: number;
  ticketPromedio: number;
};

export function VentasDashboard() {
  // Formatear precio en CLP
  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // State declarations
  const [showAnterior, setShowAnterior] = useState(false);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Product search related states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Filters state
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
  
  // Fetch data from Supabase - moved to the data fetching section with other useSupabaseData calls
  const { data: productos = [] } = useSupabaseData<any>("productos", "*");
  
  // Memoize filtered products for better performance
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    
    const searchTerm = productSearchTerm.toLowerCase();
    return productos
      .filter(p => 
        p.nombre?.toLowerCase().includes(searchTerm) ||
        p.codigo?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5);
  }, [productSearchTerm, productos]);
  
  // Filter inventory products based on search term
  const filteredInventory = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    const searchTerm = productSearchTerm.toLowerCase();
    return productos.filter(p => 
      (p.nombre?.toLowerCase().includes(searchTerm) ||
      p.codigo?.toLowerCase().includes(searchTerm)) &&
      p.activo === true // Only show active products
    );
  }, [productSearchTerm, productos]);
  
  // Handle product search with debounce
  const handleProductSearch = (term: string) => {
    setProductSearchTerm(term);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (!term.trim()) {
      setSuggestedProducts([]);
      return;
    }
    
    const timeout = setTimeout(() => {
      setSuggestedProducts(filteredProducts);
    }, 200);
    
    setSearchTimeout(timeout);
  };
  
  // Handle product selection from suggestions
  const handleProductSelect = (product: any) => {
    setProductSearchTerm(product.nombre);
    setFilters(prev => ({
      ...prev,
      producto: product.id
    }));
    setShowSuggestions(false);
  };

  // Clear product filter
  const clearProductFilter = () => {
    setProductSearchTerm('');
    setFilters(prev => ({
      ...prev,
      producto: ''
    }));
  };
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CL');
  };

  // Initialize KPI data
  const [kpiData, setKpiData] = useState<KpiData>({
    ventasTotales: 0,
    margen: 0,
    unidadesVendidas: 0,
    numeroVentas: 0,
    ticketPromedio: 0,
  });

  // KPI Cards data with proper typing and dynamic changes
  const kpiCardsData: KpiCardProps[] = useMemo(() => {
    // Calcular cambios porcentuales (simulados para el ejemplo)
    // En un entorno real, estos valores deberían comparar con el período anterior
    const getRandomChange = (base: number) => {
      const change = Math.random() * 20 - 5; // Entre -5% y +15%
      return {
        value: Math.abs(change).toFixed(0) + '%',
        isPositive: change >= 0
      };
    };

    const ventasChange = getRandomChange(kpiData.ventasTotales);
    const margenChange = getRandomChange(kpiData.margen);
    const unidadesChange = getRandomChange(kpiData.unidadesVendidas);
    const ventasNumChange = getRandomChange(kpiData.numeroVentas);
    const ticketChange = getRandomChange(kpiData.ticketPromedio);

    return [
      {
        label: "Ventas totales",
        value: formatPrice(kpiData.ventasTotales),
        change: (ventasChange.isPositive ? '+' : '') + ventasChange.value,
        isPositive: ventasChange.isPositive,
      },
      {
        label: "Margen",
        value: formatPrice(kpiData.margen),
        change: (margenChange.isPositive ? '+' : '') + margenChange.value,
        isPositive: margenChange.isPositive,
      },
      {
        label: "Unidades vendidas",
        value: kpiData.unidadesVendidas.toString(),
        change: (unidadesChange.isPositive ? '+' : '') + unidadesChange.value,
        isPositive: unidadesChange.isPositive,
      },
      {
        label: "Número de ventas",
        value: kpiData.numeroVentas.toString(),
        change: (ventasNumChange.isPositive ? '+' : '') + ventasNumChange.value,
        isPositive: ventasNumChange.isPositive,
      },
      {
        label: "Ticket promedio",
        value: formatPrice(kpiData.ticketPromedio),
        change: (ticketChange.isPositive ? '+' : '') + ticketChange.value,
        isPositive: ticketChange.isPositive,
      }
    ];
  }, [kpiData, formatPrice]);

  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  // Obtener datos de Supabase con manejo de estado de carga y error
  const [cajas, setCajas] = useState<string[]>([]);
  const [isLoadingCajas, setIsLoadingCajas] = useState(true);
  
  const { data: ventas = [], refetch } = useSupabaseData<any>(
    "ventas",
    "*, sucursales(nombre)"
  );
  
  const { data: ventaItems = [] } = useSupabaseData<any>(
    "venta_items",
    "*, productos(nombre, costo)"
  );
  
  const { data: sucursales = [] } = useSupabaseData<any>("sucursales", "*");
  
  // Obtener cajas dinámicamente
  useEffect(() => {
    const fetchCajas = async () => {
      try {
        setIsLoadingCajas(true);
        // Obtener cajas de la tabla 'cajas' o usar valores por defecto
        const { data, error } = await supabase
          .from('cajas')
          .select('*')
          .order('nombre', { ascending: true });
          
        if (error) {
          console.warn('No se encontró la tabla cajas, usando valores por defecto');
          throw error;
        }
        
        const cajasMapeadas = data.length > 0 
          ? data.map((caja: any) => `Caja N°${caja.numero || caja.id}`)
          : ['Caja N°1', 'Caja N°2', 'Caja N°3', 'Caja N°4'];
        setCajas(cajasMapeadas);
      } catch (error) {
        console.error('Error al cargar cajas:', error);
        // Valor por defecto en caso de error
        setCajas(['Caja N°1', 'Caja N°2', 'Caja N°3', 'Caja N°4']);
      } finally {
        setIsLoadingCajas(false);
      }
    };
    
    fetchCajas();
  }, []);

  // Memoize filtered ventas to avoid unnecessary recalculations
  const filteredVentas = useMemo(() => {
    const filterVentas = (venta: any): boolean => {
      // Filtro por fechas
      if (filters.fechaInicio && new Date(venta.fecha) < new Date(filters.fechaInicio)) {
        return false;
      }
      if (filters.fechaFin && new Date(venta.fecha) > new Date(filters.fechaFin)) {
        return false;
      }
      // Filtro por sucursal
      if (filters.sucursal && venta.sucursal_id !== filters.sucursal) {
        return false;
      }
      // Filtro por método de pago
      if (filters.metodo_pago && venta.metodo_pago !== filters.metodo_pago) {
        return false;
      }
      // Filtro por producto
      if (filters.producto) {
        // Buscar si alguna línea de esta venta contiene el producto filtrado
        const itemsDeEstaVenta = ventaItems.filter((item: any) => item.venta_id === venta.id);
        const tieneElProducto = itemsDeEstaVenta.some(
          (item: any) => item.producto_id === filters.producto
        );
        if (!tieneElProducto) return false;
      }
      return true;
    };

    if (!ventas) return [];
    
    return ventas.filter(filterVentas);
  }, [ventas, filters, ventaItems]);


  const calculateKpis = useCallback(async () => {
    try {
      setLoadingKpis(true);
      const currentYear = new Date(filters.fechaFin).getFullYear();
      const yearVentas = filteredVentas.filter((v: any) => {
        const ventaYear = new Date(v.fecha).getFullYear();
        return showAnterior ? ventaYear === currentYear - 1 : ventaYear === currentYear;
      });

      const totalVentas = yearVentas.reduce(
        (sum: number, venta: any) => sum + (parseFloat(venta.total) || 0),
        0
      );

      const ventasIds = new Set(yearVentas.map((v: any) => v.id));
      const relevantItems = ventaItems.filter((item: any) => ventasIds.has(item.venta_id));
      
      const totalUnidades = relevantItems.reduce((sum: number, item: any) => sum + (item.cantidad || 0), 0);
      const numeroVentas = yearVentas.length;
      const ticketPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0;

      const productosMap = new Map(productos.map((p: any) => [p.id, p]));
      const totalCosto = relevantItems.reduce((sum: number, item: any) => {
        const producto = productosMap.get(item.producto_id);
        return sum + (producto?.costo || 0) * item.cantidad;
      }, 0);
      
      const margen = totalVentas - totalCosto;

      setKpiData({
        ventasTotales: totalVentas || 0,
        margen: margen || 0,
        unidadesVendidas: totalUnidades || 0,
        numeroVentas,
        ticketPromedio,
      });
      
      setKpiError(null);
    } catch (error) {
      console.error('Error calculando KPIs:', error);
      setKpiError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoadingKpis(false);
    }
  }, [filteredVentas, filters.fechaFin, productos, ventaItems, showAnterior]);

  const calculateMonthlyChartData = useCallback((): void => {
    console.log("📊 VENTAS: Calculando datos del gráfico", { filters });

    // Si hay filtros de fecha específicos, crear datos por día
    if (filters.fechaInicio && filters.fechaFin) {
      const startDate = new Date(filters.fechaInicio);
      const endDate = new Date(filters.fechaFin);
      const dayData: Array<{mes: string, actual: number, anterior: number}> = [];

      // Crear datos día por día
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        });
        const currentYear = d.getFullYear();
        const previousYear = currentYear - 1;
        const dayEntry = { mes: dayName, actual: 0, anterior: 0 };

        filteredVentas.forEach((venta: any) => {
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
    // Lógica para meses
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

    const currentYear = filters.fechaFin 
      ? new Date(filters.fechaFin).getFullYear() 
      : new Date().getFullYear();
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
    console.log(
      "✅ VENTAS: Datos mensuales calculados",
      Array.from(dataMap.values()).length,
      "meses"
    );
  }, [filteredVentas, filters.fechaFin]);

  // Update KPIs and chart data when dependencies change
  useEffect(() => {
    const updateData = async () => {
      try {
        setLoadingKpis(true);
        setLoadingChart(true);
        await calculateKpis();
        await calculateMonthlyChartData();
        setKpiError(null);
        setChartError(null);
      } catch (error) {
        console.error('Error updating data:', error);
        const errorMsg = 'Error al cargar los datos';
        setKpiError(errorMsg);
        setChartError(errorMsg);
      } finally {
        setLoadingKpis(false);
        setLoadingChart(false);
      }
    };
    
    updateData();
    
    // Actualizar la hora cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [calculateKpis, calculateMonthlyChartData, ventas, ventaItems, productos, filters]);

  const handleDownloadReport = async (type: "excel" | "template"): Promise<void> => {
    try {
      if (type === "excel") {
        const headers = [
          'Folio',
          'Fecha',
          'Total',
          'Sucursal',
          'Método Pago',
          'Cliente',
          'Usuario',
          'Tipo DTE',
          'Estado'
        ];

        const csvContent = [
          headers.join(','),
          ...filteredVentas.map((v: any) => [
            `"${v.folio || 'N/A'}"`,
            `"${new Date(v.fecha).toLocaleDateString('es-CL')}"`,
            `"${v.total || '0'}"`,
            `"${v.sucursales?.nombre || 'N/A'}"`,
            `"${v.metodo_pago || 'N/A'}"`,
            `"${v.cliente_id || 'Cliente General'}"`,
            `"${v.usuario_id || 'Sistema'}"`,
            `"${v.tipo_dte || 'boleta'}"`,
            `"${v.estado || 'completado'}"`
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Reporte descargado exitosamente');
      } else if (type === "template") {
        // Obtener solo productos activos
        const { data: allProducts = [], error } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)  // Solo productos activos
          .eq('activo', true)  // Only get active products
          .order('nombre', { ascending: true });
        
        if (error) {
          console.error('Error fetching products:', error);
          toast.error('Error al obtener los productos');
          return;
        }
        
        if (!allProducts || allProducts.length === 0) {
          toast.error('No se encontraron productos activos para exportar');
          return;
        }
        
        // Generate CSV content with all products and empty stock column
        const headers = [
          'ID', 
          'Código', 
          'Producto', 
          'Descripción',
          'Categoría',
          'Stock Actual', // This column will be empty in the template
          'Precio de Compra',
          'Precio de Venta',
          'Proveedor',
          'Estado',
          'Fecha de Creación',
          'Última Actualización'
        ];
        
        // Create CSV rows for all products with proper formatting
        const rows = allProducts.map(producto => {
          // Format dates for better readability
          const createdAt = producto.created_at 
            ? new Date(producto.created_at).toLocaleString('es-CL') 
            : '';
          const updatedAt = producto.updated_at 
            ? new Date(producto.updated_at).toLocaleString('es-CL') 
            : '';
            
          return [
            `"${producto.id || ''}"`,
            `"${producto.codigo || ''}"`,
            `"${producto.nombre || ''}"`,
            `"${producto.descripcion || ''}"`,
            `"${producto.categoria || ''}"`,
            `""`, // Empty stock column for the template
            `"${producto.precio_compra || 0}"`,
            `"${producto.precio_venta || 0}"`,
            `"${producto.proveedor || ''}"`,
            `"${producto.activo ? 'Activo' : 'Inactivo'}"`,
            `"${createdAt}"`,
            `"${updatedAt}"`
          ].join(',');
        });
        
        // Add BOM for Excel compatibility with special characters
        const BOM = '\uFEFF';
        const csvContent = BOM + [
          headers.join(','),
          ...rows
        ].join('\r\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_inventario_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Se exportaron ${allProducts.length} productos correctamente`);
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Error al descargar el reporte");
    }
  };

  // Handle caja selection changes
  const handleCajaChange = useCallback((caja: string, checked: boolean): void => {
    setFilters(prev => ({
      ...prev,
      cajas: checked
        ? [...prev.cajas, caja]
        : prev.cajas.filter(c => c !== caja),
    }));
  }, []);

  const renderKpiCards = () => {
    if (loadingKpis) {
      return (
        <div className="col-span-full text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Cargando KPIs...</p>
        </div>
      );
    }

    if (kpiError) {
      return (
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
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {kpiCardsData.map((kpi: KpiCardProps) => (
          <div
            key={kpi.label}
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
              <span 
                className={`text-xs px-2 py-1 rounded-lg ${
                  kpi.isPositive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}
              >
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen bg-white flex flex-col relative">
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
            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
            disabled={loadingChart || loadingKpis}
            title="Actualizar"
          >
            {loadingChart || loadingKpis ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
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
        {renderKpiCards()}
        
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
                <div className="relative">
                  <div className="flex">
                    <input
                      id="producto-input"
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearchTerm}
                      onChange={(e) => {
                        handleProductSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {filters.producto && (
                      <button
                        type="button"
                        onClick={clearProductFilter}
                        className="px-3 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-r-md"
                        title="Limpiar filtro"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {showSuggestions && filteredProducts.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredProducts.map((producto) => (
                            <tr 
                              key={producto.id} 
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleProductSelect(producto)}
                            >
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {producto.nombre}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {producto.codigo || 'N/A'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  (producto.stock_actual || 0) <= 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : (producto.stock_actual || 0) < 10 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-green-100 text-green-800'
                                }`}>
                                  {producto.stock_actual || 0}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                ${producto.precio_venta ? Number(producto.precio_venta).toLocaleString('es-CL') : '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {showSuggestions && productSearchTerm && filteredProducts.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No se encontraron productos que coincidan con "{productSearchTerm}"
                      </div>
                    </div>
                  )}
                </div>
            </div>

            {/* Cashiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cajeros
              </label>
              {isLoadingCajas ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-500">Cargando cajas...</span>
                </div>
              ) : (
                <div className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2">
                  {cajas.length > 0 ? (
                    cajas.map((caja) => (
                      <label
                        key={caja}
                        htmlFor={`caja-${caja}`}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          id={`caja-${caja}`}
                          type="checkbox"
                          checked={filters.cajas.includes(caja)}
                          onChange={(e) => handleCajaChange(caja, e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                          disabled={loadingKpis || loadingChart}
                        />
                        <span className="text-gray-800">{caja}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay cajas disponibles</p>
                  )}
                </div>
              )}
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
