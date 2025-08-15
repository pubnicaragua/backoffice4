import { Sucursal } from "../../../types/cajas";
import mermaAcciones from "../reducer/actions";
import { Modal } from "../../Common/Modal";
import { estado_inicial, MermaState } from "../reducer/initials";

interface FiltersMermaProps {
    isOpen: boolean;
    onClose: () => void;
    state: MermaState;
    dispatch: React.Dispatch<{
        type: string;
        payload: any;
    }>;
    sucursales: Sucursal[];
}

function FiltersMerma({ isOpen, onClose, state, dispatch, sucursales }: FiltersMermaProps) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        dispatch({
            type: mermaAcciones.CHANGE_VALUE_FILTER,
            payload: {
                prop: name,
                data: value
            }
        });
    };

    const changeValue = (prop: string, data: any) => {
        dispatch({
            type: mermaAcciones.CHANGE_VALUE,
            payload: {
                prop,
                data
            }
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Filtrar mermas" size="sm">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                    <select
                        name="sucursal_id"
                        value={state.filters.sucursal_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                    >
                        <option value="">Todas</option>
                        {sucursales.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por tipo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de merma</label>
                    <select
                        name="tipo"
                        value={state.filters.tipo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                    >
                        <option value="">Todos</option>
                        <option value="robo">Robo</option>
                        <option value="vencimiento">Vencimiento</option>
                        <option value="daño">Daño</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                {/* Fechas
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input
                        type="date"
                        name="fecha_inicio"
                        value={state.filters.fecha_inicio || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input
                        type="date"
                        name="fecha_fin"
                        value={state.filters.fecha_fin || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div> */}

                {/* Botones */}
                <div className="flex justify-between pt-4">
                    <button
                        onClick={() => changeValue("filters", estado_inicial.filters)}
                        className="px-4 py-2 border rounded-md hover:bg-gray-100"
                    >
                        Limpiar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default FiltersMerma;
