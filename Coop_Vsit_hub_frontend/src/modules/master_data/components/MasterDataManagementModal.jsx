import React, { useState } from 'react';
import {
  Building2,
  Tags,
  DoorOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import useMasterDataStore from '../store/masterDataStore';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';

export const MasterDataManagementModal = () => {
  const {
    departments,
    categories,
    meetingRooms,
    isMasterModalOpen,
    closeMasterModal,
    activeTab,
    setActiveTab,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createCategory,
    updateCategory,
    deleteCategory,
    createMeetingRoom,
    updateMeetingRoom,
    deleteMeetingRoom,
  } = useMasterDataStore();

  // Form states for creating new items
  const [editingId, setEditingId] = useState(null);

  // Department form state
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });

  // Category form state
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Meeting room form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    floorLocation: '',
    capacity: 10,
    description: '',
  });

  const handleClose = () => {
    setEditingId(null);
    setDeptForm({ name: '', code: '', description: '' });
    setCatForm({ name: '', description: '' });
    setRoomForm({ name: '', floorLocation: '', capacity: 10, description: '' });
    closeMasterModal();
  };

  // --- Department handlers ---
  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    if (editingId) {
      await updateDepartment(editingId, deptForm);
      setEditingId(null);
    } else {
      await createDepartment(deptForm);
    }
    setDeptForm({ name: '', code: '', description: '' });
  };

  // --- Category handlers ---
  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    if (editingId) {
      await updateCategory(editingId, catForm);
      setEditingId(null);
    } else {
      await createCategory(catForm);
    }
    setCatForm({ name: '', description: '' });
  };

  // --- Meeting Room handlers ---
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;

    if (editingId) {
      await updateMeetingRoom(editingId, roomForm);
      setEditingId(null);
    } else {
      await createMeetingRoom(roomForm);
    }
    setRoomForm({ name: '', floorLocation: '', capacity: 10, description: '' });
  };

  return (
    <Modal
      isOpen={isMasterModalOpen}
      onClose={handleClose}
      title="Master Data & Facility Management"
      subtitle="Configure bank departments, partnership categories, and meeting room facilities."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-left">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('departments');
              setEditingId(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'departments'
                ? 'bg-white text-[#000000] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#00adef]" />
            <span>Departments ({departments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setEditingId(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'categories'
                ? 'bg-white text-[#000000] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tags className="w-4 h-4 text-[#e38524]" />
            <span>Partnership Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('rooms');
              setEditingId(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'rooms'
                ? 'bg-white text-[#000000] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DoorOpen className="w-4 h-4 text-emerald-600" />
            <span>Meeting Rooms & Spaces ({meetingRooms.length})</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DEPARTMENTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            {/* Create/Edit Form */}
            <form onSubmit={handleSaveDept} className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00adef] uppercase tracking-wider">
                  {editingId ? 'Edit Department' : 'Add New Department'}
                </span>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDeptForm({ name: '', code: '', description: '' });
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Department Name"
                    placeholder="e.g. Digital Banking & Payments"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Code (Optional)"
                    placeholder="DIG_BANK"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    label="Description & Scope"
                    placeholder="e.g. Omnichannel digital payments and fintech peering"
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  />
                </div>
                <div className="pt-5 shrink-0">
                  <Button type="submit" variant="orange" size="md" icon={editingId ? CheckCircle2 : Plus}>
                    {editingId ? 'Update' : 'Add Department'}
                  </Button>
                </div>
              </div>
            </form>

            {/* List Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pl-4">Department Name</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pl-4 font-bold text-[#000000]">{d.name}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{d.code || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[240px] truncate">{d.description || '—'}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(d.id);
                              setDeptForm({ name: d.name, code: d.code || '', description: d.description || '' });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit Department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete department "${d.name}"?`)) {
                                deleteDepartment(d.id, d.name);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PARTNERSHIP CATEGORIES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {/* Create/Edit Form */}
            <form onSubmit={handleSaveCat} className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e38524] uppercase tracking-wider">
                  {editingId ? 'Edit Partnership Category' : 'Add New Category'}
                </span>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setCatForm({ name: '', description: '' });
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Input
                    label="Category Name"
                    placeholder="e.g. Strategic Partner, FinTech Peer"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Description & Strategic Criteria"
                    placeholder="e.g. High-priority institutional alliance partners"
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="orange" size="md" icon={editingId ? CheckCircle2 : Plus}>
                  {editingId ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </form>

            {/* List Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pl-4">Category Name</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pl-4 font-bold text-[#000000]">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[340px] truncate">{c.description || '—'}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(c.id);
                              setCatForm({ name: c.name, description: c.description || '' });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete category "${c.name}"?`)) {
                                deleteCategory(c.id, c.name);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MEETING ROOMS & SPACES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Create/Edit Form */}
            <form onSubmit={handleSaveRoom} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  {editingId ? 'Edit Meeting Room' : 'Register New Meeting Room / Space'}
                </span>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setRoomForm({ name: '', floorLocation: '', capacity: 10, description: '' });
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Room / Facility Name"
                    placeholder="e.g. DxValley Executive Boardroom (4th Floor)"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Capacity (Persons)"
                    type="number"
                    min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) || 10 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Floor / Building Location"
                  placeholder="e.g. 4th Floor, DxValley Innovation Wing"
                  value={roomForm.floorLocation}
                  onChange={(e) => setRoomForm({ ...roomForm, floorLocation: e.target.value })}
                />
                <Input
                  label="Room Features & AV Equipment"
                  placeholder="e.g. Dual video conferencing, digital smart board"
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="orange" size="md" icon={editingId ? CheckCircle2 : Plus}>
                  {editingId ? 'Update Meeting Room' : 'Register Meeting Room'}
                </Button>
              </div>
            </form>

            {/* List Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pl-4">Meeting Room & Space</th>
                    <th className="py-2.5 px-3">Floor / Location</th>
                    <th className="py-2.5 px-3 text-center">Capacity</th>
                    <th className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meetingRooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pl-4 font-bold text-[#000000]">{r.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{r.floorLocation || 'Main Facility'}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{r.capacity} Seats</td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(r.id);
                              setRoomForm({
                                name: r.name,
                                floorLocation: r.floorLocation || '',
                                capacity: r.capacity || 10,
                                description: r.description || '',
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit Room"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete meeting room "${r.name}"?`)) {
                                deleteMeetingRoom(r.id, r.name);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MasterDataManagementModal;
