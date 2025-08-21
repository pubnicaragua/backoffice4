import { useState } from "react";
import { ProductosTotales } from "./ProductosTotales";
import Mermas from "../Mermas/mermas";
import { ToastContainer } from "react-toastify";

export function Inventario() {
    const [activeTab, setActiveTab] = useState('productos');

    const tabs = [
        { id: 'productos', label: 'Productos totales' },
        { id: 'mermas', label: 'Mermas' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'productos':
                return <ProductosTotales />;
            case 'mermas':
                return <Mermas />;
            default:
                return <ProductosTotales />;
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <nav className="flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}