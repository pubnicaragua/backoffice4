import { Modal } from "../../Common/Modal";
import mermaAcciones from "../reducer/actions";
import { useSupabaseDelete } from "../../../hooks/useSupabaseData";
import { toast } from "react-toastify";
import { MermaState } from "../reducer/initials";

interface EliminarMermaModalProps {
    state: MermaState;
    dispatch: React.Dispatch<{ type: string; payload?: any }>;
    refetch: () => void
}

function EliminarMermaModal({ state, dispatch, refetch }: EliminarMermaModalProps) {
    const { delete: supabaseDelete, loading: loadingDelete } = useSupabaseDelete("mermas");

    const confirmDelete = async () => {
        if (!state.selectedMerma) return;

        try {
            const success = await supabaseDelete(state.selectedMerma.id);

            if (!success) {
                toast.error("Error al eliminar la merma");
                return;
            }

            dispatch({
                type: mermaAcciones.CHANGE_VALUE,
                payload: { prop: "eliminarMermaModal", data: false },
            });
            dispatch({
                type: mermaAcciones.CHANGE_VALUE,
                payload: { prop: "selectedMerma", data: null },
            });

            toast.success("Merma eliminada correctamente");
            refetch()
        } catch (err) {
            console.error(err);
            toast.error("Error inesperado al eliminar la merma");
        }
    };

    return (
        <Modal
            isOpen={state.eliminarMermaModal}
            onClose={() =>
                dispatch({
                    type: mermaAcciones.CHANGE_VALUE,
                    payload: { prop: "eliminarMermaModal", data: false },
                })
            }
            title="Eliminar Merma"
            size="sm"
        >
            <div className="text-center space-y-4">
                <p>
                    ¿Estás seguro de que deseas eliminar la merma "
                    {state.selectedMerma?.producto_id}"?
                </p>
                <div className="flex justify-center space-x-3">
                    <button
                        onClick={() =>
                            dispatch({
                                type: mermaAcciones.CHANGE_VALUE,
                                payload: { prop: "eliminarMermaModal", data: false },
                            })
                        }
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmDelete}
                        disabled={loadingDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {loadingDelete ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default EliminarMermaModal;
