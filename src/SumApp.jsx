import React, { useState } from 'react';
import { Calendar, Clock, User, Info, Plus, Trash2, Edit2, X, CheckCircle, RefreshCw, Settings, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useJsonBin, loadJsonBinConfig, saveJsonBinConfig } from './useJsonBin';
import { createBin } from './jsonbinService';

// Datos iniciales de demostración
const defaultClasses = [
    { id: 1, name: 'Yoga para adultos mayores', day: 'Lunes', startTime: '09:00', endTime: '10:30', instructor: 'María González', description: 'Clases de yoga suave adaptadas para la tercera edad.' },
    { id: 2, name: 'Taller de Memoria', day: 'Martes', startTime: '10:00', endTime: '11:30', instructor: 'Lic. Juan Pérez', description: 'Ejercicios prácticos para estimular la memoria y la agilidad mental.' },
    { id: 3, name: 'Zumba', day: 'Miércoles', startTime: '18:00', endTime: '19:00', instructor: 'Ana Silva', description: 'Clase de baile aeróbico con ritmos latinos.' },
    { id: 4, name: 'Computación Básica', day: 'Jueves', startTime: '15:00', endTime: '17:00', instructor: 'Carlos Rodríguez', description: 'Introducción al uso de PC, internet y herramientas básicas.' },
    { id: 5, name: 'Pintura y Dibujo', day: 'Viernes', startTime: '16:00', endTime: '18:00', instructor: 'Elena López', description: 'Taller libre de expresión artística.' },
];

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
];

// Colores por actividad (se asignan dinámicamente)
const colorPalette = [
    { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-900', sub: 'text-indigo-700', time: 'text-indigo-600', hover: 'hover:bg-indigo-200' },
    { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-900', sub: 'text-emerald-700', time: 'text-emerald-600', hover: 'hover:bg-emerald-200' },
    { bg: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-900', sub: 'text-violet-700', time: 'text-violet-600', hover: 'hover:bg-violet-200' },
    { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-900', sub: 'text-amber-700', time: 'text-amber-600', hover: 'hover:bg-amber-200' },
    { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-900', sub: 'text-rose-700', time: 'text-rose-600', hover: 'hover:bg-rose-200' },
    { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-900', sub: 'text-cyan-700', time: 'text-cyan-600', hover: 'hover:bg-cyan-200' },
];

function getColor(id) {
    return colorPalette[id % colorPalette.length];
}

// Etiquetas de estado de sincronización
const syncLabels = {
    idle:    { label: 'Sin configurar', icon: WifiOff,    color: 'text-gray-400' },
    syncing: { label: 'Sincronizando…', icon: RefreshCw,  color: 'text-amber-400 animate-spin' },
    success: { label: 'Sincronizado',   icon: Wifi,        color: 'text-emerald-400' },
    error:   { label: 'Error de sync',  icon: AlertCircle, color: 'text-red-400' },
};

export default function SumApp() {
    // --- JSONBin config ---
    const [jsonBinCfg, setJsonBinCfg] = useState(() => loadJsonBinConfig());
    const [showSettings, setShowSettings] = useState(false);
    const [cfgForm, setCfgForm] = useState(() => loadJsonBinConfig());
    const [cfgLoading, setCfgLoading] = useState(false);
    const [cfgError, setCfgError] = useState('');

    // --- Datos con sync ---
    const { value: classes, setValue: setClasses, syncStatus, lastSynced, syncError, manualSync, isConfigured } =
        useJsonBin('sum-actividades', defaultClasses, jsonBinCfg);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [formData, setFormData] = useState({
        name: '', day: 'Lunes', startTime: '08:00', endTime: '09:00',
        instructor: '', description: ''
    });

    // --- Guardar configuración JSONBin ---
    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setCfgError('');
        const { apiKey, binId } = cfgForm;
        if (!apiKey.trim()) { setCfgError('La API Key es obligatoria.'); return; }

        // Si no hay binId, crear uno nuevo automáticamente
        if (!binId.trim()) {
            setCfgLoading(true);
            try {
                const { binId: newId } = await createBin(apiKey.trim(), classes, 'SUM-Actividades');
                const cfg = { apiKey: apiKey.trim(), binId: newId };
                saveJsonBinConfig(cfg);
                setJsonBinCfg(cfg);
                setCfgForm(cfg);
                setShowSettings(false);
                showToast(`Bin creado: ${newId}`, 'success');
            } catch (err) {
                setCfgError(err.message);
            } finally {
                setCfgLoading(false);
            }
        } else {
            const cfg = { apiKey: apiKey.trim(), binId: binId.trim() };
            saveJsonBinConfig(cfg);
            setJsonBinCfg(cfg);
            setShowSettings(false);
            showToast('Configuración guardada', 'success');
        }
    };

    const handleClearConfig = () => {
        const empty = { binId: '', apiKey: '' };
        saveJsonBinConfig(empty);
        setJsonBinCfg(empty);
        setCfgForm(empty);
        setShowSettings(false);
        showToast('Configuración eliminada', 'error');
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleOpenModal = (classData = null) => {
        if (classData) {
            setEditingClass(classData);
            setFormData(classData);
        } else {
            setEditingClass(null);
            setFormData({ name: '', day: 'Lunes', startTime: '08:00', endTime: '09:00', instructor: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClass(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingClass) {
            setClasses(classes.map(c => c.id === editingClass.id ? { ...formData, id: c.id } : c));
            if (selectedClass?.id === editingClass.id) setSelectedClass({ ...formData, id: editingClass.id });
            showToast('Actividad actualizada correctamente');
        } else {
            const newClass = { ...formData, id: Date.now() };
            setClasses([...classes, newClass]);
            showToast('Actividad creada correctamente');
        }
        handleCloseModal();
    };

    const handleDelete = (id) => {
        setClasses(classes.filter(c => c.id !== id));
        if (selectedClass?.id === id) setSelectedClass(null);
        setDeleteConfirm(null);
        showToast('Actividad eliminada', 'error');
    };

    const getClassesForSlot = (day, time) => {
        return classes.filter(c => c.day === day && c.startTime <= time && c.endTime > time);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col font-sans">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg py-4 px-6 md:px-12 flex justify-between items-center gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className="bg-white/20 backdrop-blur p-2 rounded-xl shrink-0">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gestión SUM Municipal</h1>
                        <p className="text-indigo-200 text-sm font-medium">Cronograma de Actividades</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Sync status indicator */}
                    {(() => {
                        const s = syncLabels[isConfigured ? syncStatus : 'idle'];
                        const Icon = s.icon;
                        return (
                            <button
                                onClick={isConfigured ? manualSync : undefined}
                                title={isConfigured ? (lastSynced ? `Última sync: ${lastSynced.toLocaleTimeString()}` : 'Sin sincronizar aún') : 'Configurar JSONBin'}
                                className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${isConfigured ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                                <span className="text-white/80">{s.label}</span>
                            </button>
                        );
                    })()}

                    {/* Settings button */}
                    <button
                        onClick={() => { setCfgForm(jsonBinCfg); setShowSettings(true); setCfgError(''); }}
                        title="Configurar JSONBin"
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md text-sm active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nueva Actividad</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-6 flex flex-col xl:flex-row gap-6 max-w-[1400px] mx-auto w-full">

                {/* Calendar Grid */}
                <div className="flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Horario Semanal
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            {classes.length} {classes.length === 1 ? 'actividad' : 'actividades'}
                        </span>
                    </div>

                    <div className="overflow-auto flex-grow">
                        <table className="w-full min-w-[700px] border-collapse">
                            <thead className="sticky top-0 z-20">
                                <tr>
                                    <th className="py-3 px-3 bg-gray-50 border-b border-r border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 sticky left-0 z-30">
                                        Hora
                                    </th>
                                    {daysOfWeek.map(day => (
                                        <th key={day} className="py-3 px-2 bg-gray-50 border-b border-gray-200 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {timeSlots.map((time) => (
                                    <tr key={time} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="py-2 px-3 border-r border-gray-200 text-xs font-semibold text-gray-400 whitespace-nowrap sticky left-0 bg-white z-10 group-hover:bg-slate-50/60">
                                            {time}
                                        </td>
                                        {daysOfWeek.map(day => {
                                            const slotClasses = getClassesForSlot(day, time);
                                            return (
                                                <td key={`${day}-${time}`} className="p-1.5 border-r border-gray-100 align-top" style={{ minHeight: '4rem' }}>
                                                    {slotClasses.map((cls) => {
                                                        if (cls.startTime !== time) return null;
                                                        const color = getColor(cls.id);
                                                        const startHour = parseInt(cls.startTime);
                                                        const endHour = parseInt(cls.endTime);
                                                        const span = Math.max(endHour - startHour, 1);
                                                        const isSelected = selectedClass?.id === cls.id;
                                                        return (
                                                            <div
                                                                key={cls.id}
                                                                onClick={() => setSelectedClass(isSelected ? null : cls)}
                                                                className={`${color.bg} ${color.hover} border-l-4 ${color.border} rounded-r-lg p-2 text-xs cursor-pointer transition-all shadow-sm mb-1 relative select-none
                                                                    ${isSelected ? 'ring-2 ring-offset-1 ring-indigo-400 shadow-md' : ''}`}
                                                                style={{ minHeight: `${span * 3.8}rem` }}
                                                            >
                                                                <div className={`font-bold ${color.text} truncate leading-tight`}>{cls.name}</div>
                                                                <div className={`${color.sub} truncate text-[11px] mt-0.5`}>{cls.instructor}</div>
                                                                <div className={`${color.time} text-[10px] mt-1 font-medium`}>{cls.startTime} – {cls.endTime}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="w-full xl:w-80 flex flex-col gap-4 shrink-0">

                    {/* Detail Panel */}
                    {selectedClass ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
                                <h3 className="font-bold text-base">Detalles de Actividad</h3>
                                <button onClick={() => setSelectedClass(null)} className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800 leading-tight">{selectedClass.name}</h4>
                                    <div className="flex items-center text-sm text-indigo-600 mt-1 font-medium gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {selectedClass.day}, {selectedClass.startTime} – {selectedClass.endTime} hs
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="bg-indigo-50 p-1.5 rounded-lg mt-0.5">
                                            <User className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Profesor/a</p>
                                            <p className="text-gray-800 text-sm font-medium">{selectedClass.instructor}</p>
                                        </div>
                                    </div>
                                    {selectedClass.description && (
                                        <div className="flex items-start gap-2.5">
                                            <div className="bg-indigo-50 p-1.5 rounded-lg mt-0.5">
                                                <Info className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Descripción</p>
                                                <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{selectedClass.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(selectedClass)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Editar
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(selectedClass)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center min-h-48">
                            <div className="bg-indigo-50 p-4 rounded-2xl mb-3">
                                <Calendar className="w-7 h-7 text-indigo-400" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Seleccioná una actividad</p>
                            <p className="text-gray-400 text-xs mt-1">para ver sus detalles aquí</p>
                        </div>
                    )}

                    {/* Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Resumen semanal</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Total de actividades</span>
                                <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-full text-sm">{classes.length}</span>
                            </div>
                            {daysOfWeek.map(day => {
                                const count = classes.filter(c => c.day === day).length;
                                return count > 0 ? (
                                    <div key={day} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">{day}</span>
                                        <span className="text-gray-600 font-medium">{count} {count === 1 ? 'actividad' : 'actividades'}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                </aside>
            </main>

            {/* JSONBin Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5" /> Sincronización JSONBin</h2>
                            <button onClick={() => setShowSettings(false)} className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Conectá la app a <a href="https://jsonbin.io" target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline">JSONBin.io</a> para compartir actividades entre dispositivos.</p>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">API Key (X-Master-Key)</label>
                                <input
                                    type="password" required
                                    value={cfgForm.apiKey}
                                    onChange={e => setCfgForm(p => ({ ...p, apiKey: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-sm"
                                    placeholder="$2a$10$..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bin ID <span className="font-normal normal-case text-gray-400">(dejá vacío para crear uno nuevo)</span></label>
                                <input
                                    type="text"
                                    value={cfgForm.binId}
                                    onChange={e => setCfgForm(p => ({ ...p, binId: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-sm font-mono"
                                    placeholder="68293abc..."
                                />
                            </div>

                            {cfgError && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />{cfgError}
                                </div>
                            )}

                            <div className="pt-2 flex gap-3 border-t border-gray-100">
                                {isConfigured && (
                                    <button type="button" onClick={handleClearConfig} className="px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors">
                                        Desconectar
                                    </button>
                                )}
                                <button type="button" onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm">Cancelar</button>
                                <button type="submit" disabled={cfgLoading} className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-sm shadow-sm disabled:opacity-60">
                                    {cfgLoading ? 'Creando bin…' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">¿Eliminar actividad?</h3>
                        <p className="text-gray-500 text-sm mb-6">Se eliminará <span className="font-semibold text-gray-700">"{deleteConfirm.name}"</span>. Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                className="flex-1 px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors text-sm shadow-sm"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold">
                                {editingClass ? 'Editar Actividad' : 'Nueva Actividad'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-indigo-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-indigo-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre del Curso / Actividad</label>
                                <input
                                    type="text" name="name" required
                                    value={formData.name} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                                    placeholder="Ej: Taller de Folclore"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Día de la semana</label>
                                <select
                                    name="day" value={formData.day} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-sm"
                                >
                                    {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hora Inicio</label>
                                    <input
                                        type="time" name="startTime" required
                                        value={formData.startTime} onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hora Fin</label>
                                    <input
                                        type="time" name="endTime" required
                                        value={formData.endTime} onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profesor/a a cargo</label>
                                <input
                                    type="text" name="instructor" required
                                    value={formData.instructor} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-sm"
                                    placeholder="Nombre del docente"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción breve</label>
                                <textarea
                                    name="description" rows="3"
                                    value={formData.description} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50 focus:bg-white text-sm"
                                    placeholder="Detalles sobre la actividad..."
                                />
                            </div>

                            <div className="pt-2 flex gap-3 border-t border-gray-100">
                                <button
                                    type="button" onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md text-sm active:scale-95"
                                >
                                    {editingClass ? 'Guardar Cambios' : 'Crear Actividad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
