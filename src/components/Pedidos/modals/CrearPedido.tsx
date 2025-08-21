import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "../../../lib/supabase";
import { Modal } from "../../Common/Modal";

interface AgregarPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    sucursales: any[];
    proveedores: any[];
    productos: any[];
    empresaId: string;
    refresh: () => void;
}

export function AgregarPedidoModal({
    isOpen,
    onClose,
    sucursales,
    proveedores,
    productos,
    empresaId,
    refresh
}: AgregarPedidoModalProps) {
    const [formData, setFormData] = useState({
        sucursalId: "",
        proveedorId: "",
        razonSocial: "",
        precio_promocion: "",
        productos_seleccionados: [] as any[],
    });

    const [searchTerm, setSearchTerm] = useState("");

    const filteredProductos = useMemo(() => {
        return productos.filter(
            (p) =>
                p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, productos]);

    const handleProductoSelect = (producto: any) => {
        const productFound = formData.productos_seleccionados.find((producto_seleccionado) => producto_seleccionado.id === producto.id)
        if (!productFound) {
            setFormData((prev) => ({
                ...prev,
                productos_seleccionados: [
                    ...prev.productos_seleccionados,
                    { ...producto, cantidad: 1 },
                ],
            }));
        }
        setSearchTerm("");
    };

    const handleCantidadChange = (id: string, cantidad: number) => {
        setFormData((prev) => ({
            ...prev,
            productos_seleccionados: prev.productos_seleccionados.map((p) =>
                p.id === id ? { ...p, cantidad } : p
            ),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const total = formData.productos_seleccionados.reduce(
                (acc, p) =>
                    acc +
                    (p.precio -
                        parseFloat(formData.precio_promocion || "0")) *
                    (p.cantidad || 1),
                0
            );

            const folio = `PED-${Date.now()}`;

            await supabase
                .from("pedidos")
                .insert([
                    {
                        empresa_id: empresaId,
                        proveedor_id: formData.proveedorId,
                        sucursal_id: formData.sucursalId,
                        fecha_pedido: new Date().toISOString(),
                        estado: "pendiente",
                        total,
                        folio,
                        razon_social: formData.razonSocial,
                    },
                ])
                .select()
                .single();

            toast.success("Pedido creado con éxito ✅");
            onClose();
            refresh()
            setFormData({
                sucursalId: "",
                proveedorId: "",
                razonSocial: "",
                precio_promocion: "",
                productos_seleccionados: [],
            });
        } catch (err) {
            console.error(err);
            toast.error("Error a    l crear el pedido ❌");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agregar Pedido" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de proveedor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proveedor
                    </label>
                    <select
                        value={formData.proveedorId}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                proveedorId: e.target.value,
                                razonSocial:
                                    proveedores.find((p) => p.id === e.target.value)?.nombre || "",
                            }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                    >
                        <option value="">Selecciona proveedor</option>
                        {proveedores.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                                {prov.razon_social}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selector de sucursal */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sucursal
                    </label>
                    <select
                        value={formData.sucursalId}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                sucursalId: e.target.value,
                            }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                    >
                        <option value="">Selecciona sucursal</option>
                        {sucursales.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Buscador productos */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar producto
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    {searchTerm && filteredProductos.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {filteredProductos.slice(0, 5).map((producto) => (
                                <button
                                    key={producto.id}
                                    type="button"
                                    onClick={() => handleProductoSelect(producto)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                >
                                    <div className="font-medium">{producto.nombre}</div>
                                    <div className="text-gray-500 text-xs">
                                        SKU: {producto.codigo || "N/A"} - Precio: $
                                        {producto.precio?.toLocaleString("es-CL")}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Productos seleccionados */}
                {formData.productos_seleccionados.length > 0 && (
                    <div className="space-y-3">
                        {formData.productos_seleccionados.map((producto) => (
                            <div
                                key={producto.id}
                                className="bg-gray-50 p-3 rounded-lg text-sm space-y-1"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{producto.nombre}</div>
                                        <div className="text-gray-500 text-xs">
                                            SKU: {producto.codigo || "N/A"}
                                        </div>
                                        <div className="text-xs">
                                            Precio: ${(producto.precio * (producto.cantidad || 1))?.toLocaleString("es-CL")}
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        value={producto.cantidad}
                                        onChange={(e) =>
                                            handleCantidadChange(producto.id, Number(e.target.value))
                                        }
                                        className="w-16 border rounded-md text-center"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Guardar Pedido
                    </button>
                </div>
            </form>
        </Modal>
    );
}
