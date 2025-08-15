import { Search } from "lucide-react";
import { Producto } from "../../../types";
import mermaAcciones from "../reducer/actions";
import { estado_inicial, MermaState } from "../reducer/initials";
import { Sucursal } from "../../../types/cajas";
import { Modal } from "../../Common/Modal";
import { useSupabaseInsert, useSupabaseUpdate } from "../../../hooks/useSupabaseData";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffect } from "react";

interface ReporteMermasProps {
    isOpen: boolean;
    onClose: () => void
    state: MermaState
    dispatch: React.Dispatch<{
        type: string;
        payload: any;
    }>
    productos: Producto[]
    sucursales: Sucursal[]
    refetch: () => void
}

function AgregarMermaModal({ isOpen, onClose, state, dispatch, productos, sucursales, refetch }: ReporteMermasProps) {
    const { insert, loading: loadingInsert } = useSupabaseInsert("mermas");
    const { update, loading: loadingUpdate } = useSupabaseUpdate("mermas");
    const { empresaId, sucursalId } = useAuth()

    useEffect(() => {
        if (isOpen && state.selectedMerma) {
            setFormData()
        }
    }, [isOpen, state.selectedMerma])

    const setFormData = () => {
        dispatch({
            type: mermaAcciones.SET_FORM_DATA,
            payload: state.selectedMerma
        })
    }

    const filteredProductos = (productos || []).filter(
        (producto: Producto) =>
            producto.nombre.toLowerCase().includes(state.formData.searchTerm.toLowerCase()) ||
            producto.codigo?.toLowerCase().includes(state.formData.searchTerm.toLowerCase())
    );

    const handleChange = (e: any, product_id?: string) => {
        if (product_id) {
            dispatch({
                type: mermaAcciones.CHANGE_VALUE_FORM,
                payload: {
                    prop: "producto_id",
                    data: product_id,
                }
            })
            dispatch({
                type: mermaAcciones.CHANGE_VALUE_FORM,
                payload: {
                    prop: "searchTerm",
                    data: "",
                },
            });
            return
        }

        const { name, value } = e.target
        console.log(name, value)

        dispatch({
            type: mermaAcciones.CHANGE_VALUE_FORM,
            payload: {
                prop: name,
                data: value
            },
        });

        console.log(state)
    };

    const changeValue = (prop: string, data: any) => {
        dispatch({
            type: mermaAcciones.CHANGE_VALUE,
            payload: {
                prop,
                data
            }
        });

    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { formData } = state

            const payload = {
                empresa_id: empresaId,
                sucursal_id: sucursalId,
                producto_id: formData.producto_id,
                tipo: formData.tipo,
                cantidad: formData.cantidad,
                observacion: formData.observacion || null,
                fecha: new Date().toISOString(),
            };

            console.log("Enviando merma:", payload);

            let success;

            if (state.selectedMerma) {
                success = await update(state.selectedMerma.id, payload);
            } else {
                success = await insert(payload)
            }

            if (!success) {
                console.error("Error insertando merma:");
                toast.error("Error insertando merma")
                return;
            }

            changeValue("formData", estado_inicial.formData)
            changeValue("agregarMermaModal", !state.agregarMermaModal)
            refetch()
        } catch (err) {
            console.error("Error inesperado:", err);
        }
    };


    return (
        <Modal
            onClose={onClose}
            title={`${state.selectedMerma ? "Editar r" : "R"}eporte de mermas`}
            size="sm"
            isOpen={isOpen}
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* PRODUCTO PRESELECCIONADO */}
                {state.formData.producto_id && (
                    <div className="p-3 border rounded bg-gray-50 mb-3">
                        <p className="font-semibold">Producto seleccionado:</p>
                        <p>
                            <span className="font-medium"></span> {productos.find((p) => p.id === state.formData.producto_id)?.nombre}
                        </p>
                    </div>
                )}

                {/* Buscar producto */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar Producto (SKU o nombre)
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            name="searchTerm"
                            value={state.formData.searchTerm}
                            onChange={(e) => handleChange(e)}
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="off"
                        />
                    </div>

                    {state.formData.searchTerm && filteredProductos.length > 0 && (
                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {filteredProductos.slice(0, 5).map((producto: Producto) => (
                                <button
                                    key={producto.id}
                                    type="button"
                                    onClick={() => handleChange("producto_id", producto.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                >
                                    <div className="font-medium">{producto.nombre}</div>
                                    <div className="text-gray-500 text-xs">
                                        SKU: {producto.codigo}
                                    </div>
                                </button>
                            ))}

                        </div>
                    )}
                </div>

                {/* Tipo de merma */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de merma
                    </label>
                    <select
                        value={state.formData.tipo}
                        name="tipo"
                        onChange={(e) => handleChange(e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar tipo</option>
                        <option value="robo">Robo de merma</option>
                        <option value="vencimiento">Vencimiento</option>
                        <option value="daño">Daño</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                {/* Cantidad */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad mermada <span className="text-red-600">*</span>
                    </label>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={state.formData.cantidad}
                        name="cantidad"
                        onChange={(e) => handleChange(e)}
                        placeholder="Cantidad mermada"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Observaciones */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones
                    </label>
                    <textarea
                        value={state.formData.observacion}
                        name="observacion"
                        onChange={(e) => handleChange(e)}
                        placeholder="Observaciones adicionales..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Botón enviar */}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={loadingInsert || loadingUpdate}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loadingInsert || loadingUpdate ? "Reportando..." : "Reportar merma"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default AgregarMermaModal