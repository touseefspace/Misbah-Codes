"use client";

import { useState } from "react";
import { Plus, MapPin, CheckCircle2 } from "lucide-react";
import { useBranchStore, Branch } from "@/lib/store/branch-store";
import { useEffect } from "react";

export default function BranchesClient({ initialBranches }: { initialBranches: Branch[] }) {
    const { branches, setBranches, addBranch, isLoading } = useBranchStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        is_admin_branch: false
    });
    const [formError, setFormError] = useState("");

    // Hydrate store on mount
    useEffect(() => {
        setBranches(initialBranches);
    }, [initialBranches, setBranches]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!formData.name) {
            setFormError("Branch name is required");
            return;
        }

        const result = await addBranch(formData);
        if (result.success) {
            setIsModalOpen(false);
            setFormData({ name: "", location: "", is_admin_branch: false });
        } else {
            setFormError(result.error || "Failed to create branch");
        }
    };

    return (
        <>
            <div className="flex justify-end">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={20} />
                    Add New Branch
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                    <div key={branch.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <MapPin size={24} />
                            </div>
                            {branch.is_admin_branch && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Main Branch
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold text-lg text-slate-800 mb-1">{branch.name}</h3>
                        <p className="text-slate-500 text-sm mb-4">{branch.location || "No location specified"}</p>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                            <span>ID: {branch.id.slice(0, 8)}...</span>
                        </div>
                    </div>
                ))}

                {branches.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        No branches found. Create your first branch above.
                    </div>
                )}
            </div>

            {/* Create Branch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Create New Branch</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Branch Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="e.g. DHA Branch"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Location</label>
                                <textarea
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Full address..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={formData.is_admin_branch}
                                    onChange={(e) => setFormData({ ...formData, is_admin_branch: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="isAdmin" className="text-sm text-slate-700">Set as Main/Admin Branch</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? "Creating..." : "Create Branch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
