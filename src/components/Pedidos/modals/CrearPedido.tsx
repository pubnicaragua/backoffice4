import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Modal } from "../../Common/Modal";
import { toast } from "react-toastify";

interface AgregarPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    sucursales: any[];
    empresaId: string;
    refresh: () => void;
}

export function AgregarPedidoModal({
    isOpen,
    onClose,
    sucursales,
    empresaId,
    refresh,
}: AgregarPedidoModalProps) {
    const [formData, setFormData] = useState({
        proveedor: "",
        folio_factura: "",
        monto_total: "",
        sucursal_captura: "",
        archivo_respaldo: null as File | null,
        productos: [] as { nombre: string; cantidad: number }[],
    });

    const handleClose = () => {
        onClose()
        setFormData({
            proveedor: "",
            folio_factura: "",
            monto_total: "",
            sucursal_captura: "",
            archivo_respaldo: null as File | null,
            productos: [] as { nombre: string; cantidad: number }[],
        })
    }

    const [inserting, setInserting] = useState(false);
    const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", cantidad: 1 });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, archivo_respaldo: e.target.files![0] }));
        }
    };

    const handleAgregarProducto = () => {
        if (!nuevoProducto.nombre.trim() || nuevoProducto.cantidad <= 0) {
            toast.error("Debes ingresar un nombre y cantidad válida");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            productos: [...prev.productos, nuevoProducto],
        }));
        setNuevoProducto({ nombre: "", cantidad: 1 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInserting(true);

        try {
            const { error } = await supabase.from("pedidos").insert([
                {
                    empresa_id: empresaId,
                    proveedor: formData.proveedor,
                    sucursal_id: formData.sucursal_captura,
                    total: formData.monto_total,
                    estado: "pendiente",
                    fecha_pedido: new Date().toISOString(),
                    fecha: new Date().toISOString(),
                    folio: formData.folio_factura,
                    created_at: new Date().toISOString(),
                },
            ]);

            if (error) throw error;

            toast.success("Pedido creado con éxito ✅");
            onClose();
            refresh();
            setFormData({
                proveedor: "",
                folio_factura: "",
                monto_total: "",
                sucursal_captura: "",
                archivo_respaldo: null as File | null,
                productos: [] as { nombre: string; cantidad: number }[],
            });
        } catch (err) {
            console.error(err);
            toast.error("Error al crear el pedido ❌");
        } finally {
            setInserting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Agregar Pedido" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Proveedor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proveedor *
                    </label>
                    <input
                        type="text"
                        value={formData.proveedor}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, proveedor: e.target.value }))
                        }
                        placeholder="Nombre del proveedor"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                {/* Folio Factura */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Folio factura *
                    </label>
                    <input
                        type="text"
                        value={formData.folio_factura}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, folio_factura: e.target.value }))
                        }
                        placeholder="Número de folio"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                {/* Monto Total */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto total *
                    </label>
                    <input
                        type="number"
                        value={formData.monto_total}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, monto_total: e.target.value }))
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                {/* Sucursal */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sucursal de captura *
                    </label>
                    <select
                        value={formData.sucursal_captura}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                sucursal_captura: e.target.value,
                            }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    >
                        <option value="">Seleccionar sucursal</option>
                        {sucursales?.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Productos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Productos
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={nuevoProducto.nombre}
                            onChange={(e) =>
                                setNuevoProducto((prev) => ({ ...prev, nombre: e.target.value }))
                            }
                            placeholder="Nombre del producto"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                            type="number"
                            value={nuevoProducto.cantidad}
                            onChange={(e) =>
                                setNuevoProducto((prev) => ({
                                    ...prev,
                                    cantidad: Number(e.target.value),
                                }))
                            }
                            min={1}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                            type="button"
                            onClick={handleAgregarProducto}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Agregar
                        </button>
                    </div>

                    {/* Lista de productos agregados */}
                    {formData.productos.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                            {formData.productos.map((p, i) => (
                                <li key={i} className="flex justify-between">
                                    <span>
                                        {p.nombre} (x{p.cantidad})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Archivo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Archivo de respaldo (PNG, JPG, JPEG, PDF)
                    </label>
                    <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {formData.archivo_respaldo && (
                        <p className="text-xs text-green-600 mt-1">
                            ✓ Archivo seleccionado: {formData.archivo_respaldo.name}
                        </p>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={inserting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {inserting ? "Guardando..." : "Guardar pedido"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
