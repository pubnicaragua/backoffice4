import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Badge,
  Card,
  Table,
  Button,
  Alert,
  Spinner,
  Select,
} from "flowbite-react";
import { HiRefresh, HiXCircle, HiCheckCircle, HiClock } from "react-icons/hi";
import { SesionCaja, Caja, Sucursal } from "../../types/cajas";

interface SesionCajaCompleta
  extends Omit<SesionCaja, "usuario_id" | "caja_id"> {
  caja: Pick<Caja, "id" | "nombre">;
  usuario: {
    id: string;
    email: string;
    user_metadata?: {
      nombre_completo?: string;
    };
  };
}

interface EstadoCajasProps {
  sucursalId?: string;
  modoCompacto?: boolean;
}

export function EstadoCajas({
  sucursalId,
  modoCompacto = false,
}: EstadoCajasProps) {
  const [sesiones, setSesiones] = useState<SesionCajaCompleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(
    sucursalId || ""
  );
  const [refrescando, setRefrescando] = useState(false);

  // Cargar sucursales
  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const { data, error } = await supabase
          .from("sucursales")
          .select("*")
          .order("nombre");

        if (error) throw error;
        setSucursales(data || []);

        // Si no hay sucursal seleccionada y hay sucursales, seleccionar la primera
        if (!sucursalSeleccionada && data?.length > 0) {
          setSucursalSeleccionada(data[0].id);
        }
      } catch (err) {
        console.error("Error cargando sucursales:", err);
        setError("Error al cargar las sucursales");
      }
    };

    cargarSucursales();
  }, []);

  // Cargar sesiones de caja
  const cargarSesiones = async () => {
    if (!sucursalSeleccionada) return;

    try {
      setRefrescando(true);
      setError(null);

      const query = supabase
        .from("sesiones_caja")
        .select(
          `
          *,
          caja:caja_id(id, nombre),
          usuario:usuario_id(id, email, user_metadata->nombre_completo)
        `
        )
        .eq("sucursal_id", sucursalSeleccionada)
        .order("abierta_en", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setSesiones(data || []);
    } catch (err) {
      console.error("Error cargando sesiones:", err);
      setError("Error al cargar las sesiones de caja");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  // Cargar sesiones cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (sucursalSeleccionada) {
      cargarSesiones();
    }
  }, [sucursalSeleccionada]);

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!sucursalSeleccionada) return;

    const subscription = supabase
      .channel("cambios_sesiones_caja")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sesiones_caja",
          filter: `sucursal_id=eq.${sucursalSeleccionada}`,
        },
        (payload) => {
          console.log("Cambio en tiempo real:", payload);
          cargarSesiones(); // Recargar datos cuando hay cambios
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sucursalSeleccionada]);

  // Función para forzar el cierre de una caja
  const forzarCierre = async (sesionId: string) => {
    if (
      !confirm(
        "¿Está seguro de forzar el cierre de esta caja? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("sesiones_caja")
        .update({
          estado: "cerrada",
          cerrada_en: new Date().toISOString(),
          observaciones: "Cierre forzado por administrador",
        })
        .eq("id", sesionId);

      if (error) throw error;

      // Recargar datos
      await cargarSesiones();

      alert("Caja cerrada exitosamente");
    } catch (err) {
      console.error("Error forzando cierre:", err);
      setError("Error al forzar el cierre de la caja");
    }
  };

  // Función para formatear fechas
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderizar en modo compacto
  if (modoCompacto) {
    return (
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Estado de Cajas</h3>
          <Button
            size="xs"
            color="light"
            onClick={cargarSesiones}
            disabled={refrescando}
          >
            <HiRefresh
              className={`mr-2 h-4 w-4 ${refrescando ? "animate-spin" : ""}`}
            />
            {refrescando ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>

        {error && (
          <Alert color="failure" className="mb-4">
            {error}
          </Alert>
        )}

        {cargando ? (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="space-y-2">
            {sesiones.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay cajas abiertas
              </p>
            ) : (
              sesiones
                .filter((s) => s.estado === "abierta")
                .map((sesion) => (
                  <div
                    key={sesion.id}
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{sesion.caja.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {sesion.usuario.user_metadata?.nombre_completo ||
                          sesion.usuario.email}
                      </p>
                    </div>
                    <Badge color="success" className="flex items-center">
                      <HiCheckCircle className="mr-1 h-4 w-4" />
                      Abierta
                    </Badge>
                  </div>
                ))
            )}
          </div>
        )}
      </Card>
    );
  }

  // Renderizado completo
  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold">Control de Cajas</h3>
          <p className="text-sm text-gray-600">
            Visualiza y gestiona el estado de las cajas en tiempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={sucursalSeleccionada}
            onChange={(e) => setSucursalSeleccionada(e.target.value)}
            className="min-w-[200px]"
            disabled={cargando || refrescando}
          >
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </Select>

          <Button
            color="light"
            onClick={cargarSesiones}
            disabled={cargando || refrescando}
            className="flex items-center justify-center"
          >
            <HiRefresh
              className={`mr-2 h-4 w-4 ${refrescando ? "animate-spin" : ""}`}
            />
            {refrescando ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}

      {cargando ? (
        <div className="flex justify-center py-8">
          <Spinner size="xl" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Caja</Table.HeadCell>
              <Table.HeadCell>Usuario</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell>Saldo Inicial</Table.HeadCell>
              <Table.HeadCell>Abierta el</Table.HeadCell>
              <Table.HeadCell>Acciones</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {sesiones.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={6}
                    className="text-center py-4 text-gray-500"
                  >
                    No hay registros de cajas
                  </Table.Cell>
                </Table.Row>
              ) : (
                sesiones.map((sesion) => (
                  <Table.Row
                    key={sesion.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {sesion.caja.nombre}
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="font-medium">
                          {sesion.usuario.user_metadata?.nombre_completo ||
                            "Usuario sin nombre"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sesion.usuario.email}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          sesion.estado === "abierta"
                            ? "success"
                            : sesion.estado === "pendiente_aprobacion"
                            ? "warning"
                            : "gray"
                        }
                        className="inline-flex items-center"
                      >
                        {sesion.estado === "abierta" ? (
                          <>
                            <HiCheckCircle className="mr-1 h-4 w-4" />
                            Abierta
                          </>
                        ) : sesion.estado === "pendiente_aprobacion" ? (
                          <>
                            <HiClock className="mr-1 h-4 w-4" />
                            Pendiente
                          </>
                        ) : (
                          <>
                            <HiXCircle className="mr-1 h-4 w-4" />
                            Cerrada
                          </>
                        )}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>${sesion.saldo_inicial.toFixed(2)}</Table.Cell>
                    <Table.Cell>{formatearFecha(sesion.abierta_en)}</Table.Cell>
                    <Table.Cell>
                      {sesion.estado === "abierta" && (
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() => forzarCierre(sesion.id)}
                          className="whitespace-nowrap"
                        >
                          Forzar Cierre
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      )}
    </Card>
  );
}

export default EstadoCajas;
