import { Merma, MermaConNombres } from "../../../types";

interface Filters {
    sucursal_id?: string;
    producto_id?: string;
    tipo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
}

interface FormData {
    producto_id: string;
    tipo: string;
    cantidad: number;
    observacion: string;
    sucursal_id: string;
    searchTerm: string;
}

export interface MermaState {
    loading: boolean;
    error: string | null;
    mermas: MermaConNombres[];
    searchTerm: string;
    selectedMermas: string[];
    selectedMerma: Merma | null;
    agregarMermaModal: boolean;
    eliminarMermaModal: boolean;
    showFilters: boolean;
    filters: Filters;
    formData: FormData;
    currentPage: number;
    itemsPerPage: number;
    sortConfig: {
        key: keyof Merma | null;
        direction: 'asc' | 'desc';
    };
}

export const estado_inicial: MermaState = {
    loading: false,
    error: null,
    mermas: [],
    searchTerm: "",
    selectedMermas: [],
    selectedMerma: null,
    agregarMermaModal: false,
    eliminarMermaModal: false,
    showFilters: false,
    filters: {
        sucursal_id: "",
        producto_id: "",
        tipo: "",
        fecha_inicio: "",
        fecha_fin: ""
    },
    formData: {
        producto_id: "",
        tipo: "",
        cantidad: 0,
        observacion: "",
        searchTerm: "",
        sucursal_id: "",
    },
    currentPage: 1,
    itemsPerPage: 25,
    sortConfig: {
        key: null,
        direction: 'asc'
    }
};