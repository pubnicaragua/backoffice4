import { useState } from "react";
import { Label, TextInput, Textarea, Button, Spinner } from "flowbite-react";
import { Modal } from "../../Common/Modal";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-toastify";
import { Sucursal } from "../../../types/cajas";

interface CrearCajaModalProps {
    isOpen: boolean;
    onClose: () => void;
    empresaId: string;
    sucursales: Sucursal[];
}

export function CrearCajaModal({ isOpen, onClose, empresaId, sucursales }: CrearCajaModalProps) {
    const [form, setForm] = useState({ nombre: "", descripcion: "", sucursalId: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setForm((prev) => ({ ...prev, [id]: value }));
    };

    const handleSucursalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setForm((prev) => ({ ...prev, sucursalId: value }));
    };

    const handleCrearCaja = async () => {
        if (!form.nombre || !form.sucursalId) {
            toast.error("El nombre y la sucursal son obligatorios");
            return;
        }

        setLoading(true);
        try {
            // 1. Verificar si ya existe una caja con el mismo nombre en la sucursal
            const { data: existingCajas, error: checkError } = await supabase
                .from("cajas")
                .select("*")
                .eq("sucursal_id", form.sucursalId)
                .eq("nombre", form.nombre)
                .single();

            if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows found
                throw checkError;
            }

            if (existingCajas) {
                toast.error("❌ Ya existe una caja con ese nombre en la sucursal seleccionada");
                setLoading(false);
                return;
            }

            // 2. Crear la caja si no existe
            const { error } = await supabase.from("cajas").insert({
                empresa_id: empresaId,
                sucursal_id: form.sucursalId,
                nombre: form.nombre,
                descripcion: form.descripcion,
                activo: true,
            });

            if (error) throw error;

            toast.success("✅ Caja creada correctamente");
            onClose();
            setForm({ nombre: "", descripcion: "", sucursalId: "" });
        } catch (err: any) {
            console.error("❌ Error creando caja", err.message);
            toast.error("Error creando caja: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Caja" size="md">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="sucursalSeleccionadaId">Selecciona una Sucursal</Label>
                    <select
                        id="sucursalSeleccionadaId"
                        value={form.sucursalId}
                        onChange={handleSucursalChange}
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1"
                        required
                    >
                        <option value="" disabled>-- Seleccionar sucursal --</option>
                        {sucursales.map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <Label htmlFor="nombre">Nombre de la caja</Label>
                    <TextInput
                        id="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Caja Principal"
                        required
                        disabled={loading}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                        id="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        placeholder="Ej: Caja principal de la sucursal"
                        disabled={loading}
                        rows={3}
                        className="mt-1"
                    />
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                    <Button color="gray" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button color="success" onClick={handleCrearCaja} disabled={loading || !form.nombre || !form.sucursalId}>
                        {loading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Creando...
                            </>
                        ) : (
                            "Crear Caja"
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
