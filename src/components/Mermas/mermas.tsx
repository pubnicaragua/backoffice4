import { Search, Trash2, Download, Filter, Plus, Edit } from "lucide-react";
import { useEffect, useReducer } from "react";
import { estado_inicial, mermaAcciones, mermaReducer } from './reducer/reducer'
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";
import { Merma, MermaConNombres, Producto } from "../../types";
import { Sucursal } from "../../types/cajas";
import AgregarMermaModal from "./modals/agregar-merma";
import FiltersMerma from "./modals/filtros-merma";
import EliminarMermaModal from "./modals/eliminar-merma";
import saveAs from "file-saver";

function Mermas() {
    const [state, dispatch] = useReducer(mermaReducer, estado_inicial);
    const { empresaId } = useAuth()

    const {
        data: mermas,
        error: mermasError,
        refetch: mermasRefetch,
    } = useSupabaseData<Merma>(
        "mermas",
        "*",
        empresaId ? { empresa_id: empresaId } : undefined
    );

    const {
        data: sucursales,
        error: sucursalesError
    } = useSupabaseData<Sucursal>(
        "sucursales",
        "*",
        empresaId ? { empresa_id: empresaId } : undefined
    )

    const {
        data: productos,
        error: productosError
    } = useSupabaseData<Producto>(
        "productos",
        "*",
        {
            activo: true,
        }
    )

    useEffect(() => {
        if (mermas && sucursales && productos) {
            setMermas()
        }
    }, [state.loading, mermas, sucursales, productos])

    const setMermas = async () => {
        if (!mermasError || mermas) {
            console.log(mermas)
            console.log(sucursales)
            const payload: MermaConNombres[] = mermas.map((merma) => ({
                ...merma,
                sucursal_nombre: sucursales.find((s) => s.id === merma.sucursal_id)?.nombre || "No encontrada",
                producto_nombre: productos.find((p) => p.id === merma.producto_id)?.nombre || "No encontrado",
            }));

            dispatch({
                type: mermaAcciones.LOAD_MERMAS,
                payload
            })
        }
    }

    const getFilteredMermas = () => {
        try {
            if (!Array.isArray(state.mermas) || state.mermas.length === 0) return [];

            const term = typeof state.searchTerm === 'string'
                ? state.searchTerm.toLowerCase().trim()
                : '';

            const { sucursal_id, producto_id, tipo, fecha_inicio, fecha_fin } = state.filters;

            return state.mermas.filter((merma) => {
                if (!merma || typeof merma !== 'object') return false;

                // Filtrado por searchTerm
                const fieldsToSearch = [
                    merma.observacion?.toString().toLowerCase() || '',
                    merma.tipo?.toString().toLowerCase() || '',
                    merma.id?.toString().toLowerCase() || '',
                    merma.sucursal_id?.toString().toLowerCase() || '',
                    merma.producto_id?.toString().toLowerCase() || '',
                    merma.cantidad?.toString() || '',
                    merma.fecha ? new Date(merma.fecha).toLocaleDateString() : ''
                ];

                const matchesSearch = term === '' || fieldsToSearch.some(field => field.includes(term));

                // Filtrado por filtros específicos
                const matchesSucursal = !sucursal_id || merma.sucursal_id === sucursal_id;
                const matchesProducto = !producto_id || merma.producto_id === producto_id;
                const matchesTipo = !tipo || merma.tipo === tipo;

                let matchesFecha = true;
                if (fecha_inicio) {
                    matchesFecha = new Date(merma.fecha || '') >= new Date(fecha_inicio);
                }
                if (matchesFecha && fecha_fin) {
                    matchesFecha = new Date(merma.fecha || '') <= new Date(fecha_fin);
                }

                return matchesSearch && matchesSucursal && matchesProducto && matchesTipo && matchesFecha;
            });
        } catch (error) {
            console.error('Error filtering mermas:', error);
            return [];
        }
    };


    const changeValue = (prop: string, data: any) => {
        dispatch({
            type: mermaAcciones.CHANGE_VALUE,
            payload: {
                prop,
                data
            }
        });
    };

    const toggleSelectMerma = (id: string) => {
        dispatch({
            type: mermaAcciones.TOGGLE_SELECT_MERMA,
            payload: id
        });
    };

    const handlePageChange = (page: number) => {
        dispatch({
            type: mermaAcciones.CHANGE_PAGE,
            payload: page
        });
    };

    const handleItemsPerPageChange = (items: number) => {
        dispatch({
            type: mermaAcciones.CHANGE_ITEMS_PER_PAGE,
            payload: items
        });
    };

    const handleDownloadMermas = () => {
        const headers = [
            "Sucursal",
            "Producto",
            "Tipo",
            "Cantidad",
            "Observación",
            "Fecha",
        ];

        // Creamos el contenido del CSV recorriendo los datos de la tabla
        const csvContent = "\uFEFF" + [
            headers.join(","),
            ...paginatedData.map((merma) =>
                [
                    merma.sucursal_nombre,
                    merma.producto_nombre,
                    merma.tipo || "N/A",
                    merma.cantidad,
                    merma.observacion || "N/A",
                    merma.fecha ? new Date(merma.fecha).toLocaleDateString() : "N/A",
                ].join(",")
            ),
        ].join("\n");

        // Creamos el archivo y lo descargamos
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `reporte_pedidos_${new Date().toISOString().split("T")[0]}.csv`);
    };


    const handleEditMerma = (merma: Merma) => {
        changeValue("selectedMerma", merma)
        changeValue('agregarMermaModal', !state.agregarMermaModal)
    }
    const handleDeleteMerma = (merma: Merma) => {
        changeValue("selectedMerma", merma)
        changeValue("eliminarMermaModal", !state.eliminarMermaModal)
    }

    // Calculate pagination values
    const filteredMermas = getFilteredMermas();
    const totalItems = filteredMermas.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const paginatedData = filteredMermas.slice(startIndex, startIndex + state.itemsPerPage);

    return (
        <>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Registro de Mermas
                    </h1>
                </div>

                {/* Search and actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            id="search-mermas"
                            name="search-mermas"
                            type="text"
                            placeholder="Buscar mermas..."
                            value={state.searchTerm}
                            onChange={(e) => changeValue("searchTerm", e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        {state.selectedMermas.length > 0 && (
                            <button
                                // onClick={() => dispatch({ type: mermaAcciones.BULK_DELETE })}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                type="button"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Eliminar {state.selectedMermas.length}</span>
                            </button>
                        )}
                        <button
                            onClick={() => handleDownloadMermas()}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            title="Descargar Reporte"
                            type="button"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => changeValue("showFilters", true)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            title="Filtros"
                            type="button"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => changeValue("agregarMermaModal", true)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            title="Agregar Merma"
                            type="button"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>
                                    Sucursal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '10%' }}>
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '10%' }}>
                                    Cantidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '20%' }}>
                                    Observación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedData.map((merma) => (
                                <tr key={merma.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {merma.sucursal_nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {merma.producto_nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {merma.tipo || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {merma.cantidad}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {merma.observacion || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {merma.fecha ? new Date(merma.fecha).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 flex space-x-2">
                                        <button
                                            onClick={() => handleEditMerma(merma)}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMerma(merma)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Mostrar:</span>
                                <select
                                    value={state.itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                    Mostrando {startIndex + 1} a{" "}
                                    {Math.min(startIndex + state.itemsPerPage, filteredMermas.length)} de{" "}
                                    {filteredMermas.length} mermas
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, state.currentPage - 1))}
                                    disabled={state.currentPage === 1}
                                    className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    type="button"
                                >
                                    Anterior
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 rounded-md text-sm ${state.currentPage === page
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                                }`}
                                            type="button"
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, state.currentPage + 1))}
                                    disabled={state.currentPage === totalPages}
                                    className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    type="button"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <EliminarMermaModal state={state} dispatch={dispatch} refetch={mermasRefetch} />
            <FiltersMerma state={state} dispatch={dispatch} isOpen={state.showFilters} onClose={() => changeValue("showFilters", !state.showFilters)} sucursales={sucursales} />
            <AgregarMermaModal refetch={mermasRefetch} state={state} dispatch={dispatch} productos={productos} sucursales={sucursales} isOpen={state.agregarMermaModal} onClose={() => changeValue("agregarMermaModal", !state.agregarMermaModal)} />
        </>
    );
}

export default Mermas;