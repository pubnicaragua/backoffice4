import React, { useState, useMemo } from "react";
import { Table } from "../Common/Table";
import { Search, ArrowLeft } from "lucide-react";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";

export function ReporteAsistencia() {
  const { empresaId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar asistencias por empresa
  const { data: asistencias, loading } = useSupabaseData<any>(
    "asistencias",
    "*, usuarios(nombres, apellidos, rut)",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Validación de empresa
  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

  const columns = [
    { key: "nombre", label: "Nombres" },
    { key: "rut", label: "RUT" },
    { key: "horasTrabajadas", label: "Horas trabajadas este mes" },
    { key: "diasPresente", label: "Días presente" },
  ];

  // Procesar datos reales agrupados por usuario
  const processedData = useMemo(() => {
    if (!asistencias) return [];

    const usuariosMap = new Map();

    asistencias.forEach((asistencia) => {
      const usuarioId = asistencia.usuario_id;
      const usuario = asistencia.usuarios;

      if (!usuariosMap.has(usuarioId)) {
        usuariosMap.set(usuarioId, {
          nombre: `${usuario?.nombres || ""} ${
            usuario?.apellidos || ""
          }`.trim(),
          rut: usuario?.rut || "Sin RUT",
          horasTotales: 0,
          diasPresente: 0,
        });
      }

      const userData = usuariosMap.get(usuarioId);

      // Calcular horas trabajadas
      if (asistencia.hora_ingreso && asistencia.hora_salida) {
        const horas = Math.round(
          (new Date(`1970-01-01T${asistencia.hora_salida}`) -
            new Date(`1970-01-01T${asistencia.hora_ingreso}`)) /
            (1000 * 60 * 60)
        );
        userData.horasTotales += horas;
      }

      // Contar días presente
      if (asistencia.estado === "presente") {
        userData.diasPresente += 1;
      }
    });

    return Array.from(usuariosMap.values()).map((userData) => ({
      nombre: userData.nombre,
      rut: userData.rut,
      horasTrabajadas: `${userData.horasTotales}H`,
      diasPresente: userData.diasPresente,
    }));
  }, [asistencias]);

  const filteredData = processedData.filter(
    (item) =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rut.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-4">Cargando asistencias...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Reporte de asistencia
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">Este mes</span>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredData}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / 10)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
