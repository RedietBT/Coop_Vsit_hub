import React, { useState, useEffect } from 'react';
import {
  Building2,
  Handshake,
  DoorOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import useMasterDataStore from '../store/masterDataStore';
import masterDataApi from '../api/masterDataApi';
import { toast } from 'sonner';

export const MasterDataManagementModal = () => {
  const {
    isMasterModalOpen,
    activeTab,
    departments,
    categories,
    meetingRooms,
    closeMasterModal,
    setActiveTab,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchMeetingRooms,
    createMeetingRoom,
    updateMeetingRoom,
    deleteMeetingRoom,
  } = useMasterDataStore();

  const [editingId, setEditingId] = useState(null);

  // Forms
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [roomForm, setRoomForm] = useState({
    name: '',
    department: '',
    capacity: 18,
    imageUrl: '',
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleClose = () => {
    setEditingId(null);
    setDeptForm({ name: '', code: '', description: '' });
    setCatForm({ name: '', description: '' });
    setRoomForm({ name: '', department: '', capacity: 18, imageUrl: '' });
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
    setRoomForm({ name: '', department: '', capacity: 18, imageUrl: '' });
  };

  const handleRoomImageUpload = async (e, roomId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG/JPEG/WEBP)');
      return;
    }

    try {
      setIsUploadingImage(true);
      if (roomId) {
        const updated = await masterDataApi.uploadRoomImage(roomId, file);
        toast.success('Room photo uploaded successfully!');
        fetchMeetingRooms(false);
        if (editingId === roomId) {
          setRoomForm((prev) => ({ ...prev, imageUrl: updated.imageUrl }));
        }
      } else {
        // Convert to data url for preview before create
        const reader = new FileReader();
        reader.onload = () => {
          setRoomForm((prev) => ({ ...prev, imageUrl: reader.result }));
          toast.success('Photo ready for new room registration.');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload room image.');
    } finally {
      setIsUploadingImage(false);
    }
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-white text-[#00adef] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bank Departments ({departments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setEditingId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white text-[#e38524] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Handshake className="w-4 h-4" />
            <span>Partnership Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('rooms');
              setEditingId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
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
                    placeholder="e.g. Digital Banking & Technology"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Dept Code"
                    placeholder="e.g. DBT"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <Input
                label="Description & Scope"
                placeholder="e.g. Responsible for digital channels, mobile banking, and fintech partnerships"
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              />

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="md" icon={editingId ? CheckCircle2 : Plus}>
                  {editingId ? 'Update Department' : 'Add Department'}
                </Button>
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
        {/* TAB 3: MEETING ROOMS & SPACES (3 STRICT FIELDS + PHOTO UPLOAD) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Create/Edit Form */}
            <form onSubmit={handleSaveRoom} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  {editingId ? 'Edit Meeting Room' : 'Register New Meeting Room'}
                </span>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setRoomForm({ name: '', capacity: 18, imageUrl: '' });
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Room Name & Floor */}
                <div>
                  <Input
                    label="Room Name & Floor"
                    placeholder="e.g. Executive Boardroom"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* 2. Department (Dynamically populated from Master Data) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Managing Department
                  </label>
                  <select
                    value={roomForm.department}
                    onChange={(e) => setRoomForm({ ...roomForm, department: e.target.value })}
                    className="w-full h-[42px] px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00adef]"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Seating Capacity */}
                <div>
                  <Input
                    label="Seating Capacity"
                    type="number"
                    min="1"
                    placeholder="e.g. 18"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              {/* 4. Room Image & Photo Upload */}
              <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Room Image / Photo
                </label>
                <div className="flex items-center gap-3">
                  {roomForm.imageUrl ? (
                    <img
                      src={roomForm.imageUrl}
                      alt="Room Preview"
                      className="w-16 h-12 object-cover rounded-lg border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1">
                    <Input
                      placeholder="Paste Image URL or upload photo below"
                      value={roomForm.imageUrl}
                      onChange={(e) => setRoomForm({ ...roomForm, imageUrl: e.target.value })}
                    />
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleRoomImageUpload(e, editingId)}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="orange" size="md" icon={editingId ? CheckCircle2 : Plus}>
                  {editingId ? 'Update Meeting Room' : 'Register Room'}
                </Button>
              </div>
            </form>

            {/* List Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pl-4">Photo</th>
                    <th className="py-2.5 px-3">Room Name & Floor</th>
                    <th className="py-2.5 px-3">Managing Department</th>
                    <th className="py-2.5 px-3 text-center">Capacity</th>
                    <th className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meetingRooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pl-4 w-12">
                        {r.imageUrl ? (
                          <img
                            src={r.imageUrl}
                            alt={r.name}
                            className="w-10 h-8 object-cover rounded-md border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                            <DoorOpen className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#000000]">{r.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#00adef] font-bold text-[11px]">
                          {r.department || 'General Facility'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{r.capacity} Seats</td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <label className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer" title="Upload Photo">
                            <Upload className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleRoomImageUpload(e, r.id)}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(r.id);
                              setRoomForm({
                                name: r.name,
                                department: r.department || '',
                                capacity: r.capacity || 18,
                                imageUrl: r.imageUrl || '',
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit Meeting Room"
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
