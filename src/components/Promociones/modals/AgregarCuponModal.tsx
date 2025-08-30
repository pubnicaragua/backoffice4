import React, { useState, useEffect } from "react";
import { Modal } from "../../Common/Modal";
import { toast } from "react-toastify";
import { useSupabaseData } from "../../../hooks/useSupabaseData";
import { Sucursal } from "../../../types/cajas";
import { supabase } from "../../../lib/supabase";

interface CuponFormModalProps {
    show: boolean;
    onClose: () => void;
    empresaId: string;
    insert: (data: any) => Promise<boolean>;
    update: (id: string, data: any) => Promise<boolean>;
    validarCodigoUnico: (codigo: string) => Promise<boolean>;
    refetch: () => void;
    selectedCupon?: any;
}

const CuponFormModal: React.FC<CuponFormModalProps> = ({
    show,
    onClose,
    empresaId,
    insert,
    update,
    validarCodigoUnico,
    refetch,
    selectedCupon,
}) => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([])
    const [formData, setFormData] = useState<any>({
        codigo: "",
        nombre: "",
        descripcion: "",
        tipo: "descuento",
        valor: "",
        usos_maximos: "",
        fecha_inicio: "",
        fecha_fin: "",
        producto_id: null,
        selectedSucursalId: "",
    });

    useEffect(() => {
    }, [empresaId])

    const getSucursales = async () => {
        const { data, error } = await supabase.from("sucursales").select("*").eq("empresa_id", empresaId)

        if (error) {
            toast.error("Error al cargar las sucursales")
            return
        }

        setSucursales(data)
    }

    // Cargar datos si es edición
    useEffect(() => {
        if (selectedCupon) {
            setFormData({
                codigo: selectedCupon.codigo,
                nombre: selectedCupon.nombre,
                tipo: selectedCupon.tipo,
                valor: selectedCupon.valor?.toString() || "",
                usos_maximos: selectedCupon.usos_maximos?.toString() || "",
                fecha_inicio: selectedCupon.fecha_inicio || "",
                fecha_fin: selectedCupon.fecha_fin || "",
                producto_id: selectedCupon.producto_id || ""
            });
        } else {
            // limpiar si es nuevo
            setFormData({
                codigo: "",
                nombre: "",
                tipo: "descuento",
                valor: "",
                usos_maximos: "",
                fecha_inicio: "",
                fecha_fin: "",
                producto_id: null,
            });
        }
    }, [selectedCupon, show]);

    // Submit (crear o editar)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCupon) {
            const codigoEsUnico = await validarCodigoUnico(formData.codigo);
            if (!codigoEsUnico) {
                toast.error("Error: Ya existe un cupón con este código en tu empresa");
                return;
            }
        }

        const payload = {
            empresa_id: empresaId,
            sucursal_id: formData.selectedSucursaId,
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            tipo: formData.tipo,
            valor: parseFloat(formData.valor),
            usos_maximos: parseInt(formData.usos_maximos),
            fecha_inicio: formData.fecha_inicio || null,
            fecha_fin: formData.fecha_fin || null,
            activo: true,
        };

        if (formData.tipo === "descuento") {
            payload.valor = parseFloat(formData.valor);
        } else {
            payload.valor = 0;
        }

        let success = false;
        if (selectedCupon) {
            success = await update(selectedCupon.id, payload);
        } else {
            success = await insert(payload);
        }

        if (success) {
            refetch();
            onClose();
        }
    };

    return (
        <Modal
            isOpen={show}
            onClose={onClose}
            title={selectedCupon ? "Editar Cupón" : "Agregar Cupón"}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Código */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código
                    </label>
                    <input
                        type="text"
                        value={formData.codigo}
                        onChange={(e) =>
                            setFormData((prev: any) => ({ ...prev, codigo: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                        disabled={!!selectedCupon}
                    />
                </div>

                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                            setFormData((prev: any) => ({ ...prev, nombre: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                {/* Tipo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                    </label>
                    <select
                        value={formData.tipo}
                        onChange={(e) =>
                            setFormData((prev: any) => ({ ...prev, tipo: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="descuento">Descuento</option>
                        <option value="envio">Envío Gratis</option>
                    </select>
                </div>

                {/* Valor */}
                {formData.tipo === "descuento" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor (%)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={formData.valor}
                            onChange={(e) =>
                                setFormData((prev: any) => ({
                                    ...prev,
                                    valor: Math.min(100, Math.max(1, Number(e.target.value))) // fuerza entre 1 y 100
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                )}


                {/* Usos máximos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usos Máximos
                    </label>
                    <input
                        type="number"
                        value={formData.usos_maximos}
                        onChange={(e) =>
                            setFormData((prev: any) => ({
                                ...prev,
                                usos_maximos: e.target.value,
                            }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={formData.fecha_inicio}
                            onChange={(e) =>
                                setFormData((prev: any) => ({
                                    ...prev,
                                    fecha_inicio: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={formData.fecha_fin}
                            onChange={(e) =>
                                setFormData((prev: any) => ({
                                    ...prev,
                                    fecha_fin: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                {/* Botón */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        {selectedCupon ? "Actualizar Cupón" : "Guardar Cupón"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CuponFormModal;