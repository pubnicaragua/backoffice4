import mermaAcciones from "./actions";
import { MermaState, estado_inicial } from "./initials"

function mermaReducer(state = estado_inicial, action: any): MermaState {
    const { type, payload } = action
    switch (type) {
        // Loading mermas
        case mermaAcciones.LOAD_MERMAS:
            return {
                ...state,
                mermas: payload,
                loading: false,
                error: null
            };

        // Form handling
        case mermaAcciones.CHANGE_VALUE:
            return {
                ...state,
                [payload.prop]: payload.data
            };

        case mermaAcciones.CHANGE_VALUE_FORM:
            return {
                ...state,
                formData: {
                    ...state.formData,
                    [payload.prop]: payload.data
                }
            };

        case mermaAcciones.CHANGE_VALUE_FILTER: {
            return {
                ...state,
                filters: {
                    ...state.formData,
                    [payload.prop]: payload.data
                }
            }
        }

        case mermaAcciones.SET_FORM_DATA: {
            return {
                ...state,
                formData: {
                    ...payload,
                    searchTerm: ""
                }
            }
        }

        // Selection
        case mermaAcciones.TOGGLE_SELECT_MERMA:
            return {
                ...state,
                selectedMermas: state.selectedMermas.includes(payload)
                    ? state.selectedMermas.filter(id => id !== payload)
                    : [...state.selectedMermas, payload]
            };

        // UI Modals
        case mermaAcciones.TOGGLE_AGREGAR_MODAL:
            return {
                ...state,
                agregarMermaModal: !state.agregarMermaModal,
                selectedMerma: state.agregarMermaModal ? null : state.selectedMerma
            };

        case mermaAcciones.TOGGLE_FILTERS_MODAL:
            return { ...state, showFilters: !state.showFilters };

        // Pagination
        case mermaAcciones.CHANGE_PAGE:
            return { ...state, currentPage: payload };

        case mermaAcciones.CHANGE_ITEMS_PER_PAGE:
            return {
                ...state,
                itemsPerPage: payload,
                currentPage: 1
            };

        // Sorting
        case mermaAcciones.SORT_MERMAS:
            return {
                ...state,
                sortConfig: {
                    key: payload,
                    direction:
                        state.sortConfig.key === payload && state.sortConfig.direction === 'asc'
                            ? 'desc'
                            : 'asc'
                }
            };

        // Filters
        case mermaAcciones.APPLY_FILTERS:
            return {
                ...state,
                filters: payload,
                currentPage: 1
            };

        case mermaAcciones.RESET_FILTERS:
            return {
                ...state,
                filters: estado_inicial.filters,
                currentPage: 1
            };

        // Form operations
        case mermaAcciones.RESET_FORM:
            return {
                ...state,
                formData: estado_inicial.formData,
                selectedMerma: null
            };

        default:
            return state;
    }
}

export { mermaAcciones, estado_inicial, mermaReducer };