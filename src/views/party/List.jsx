"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, ChevronUp, ChevronDown, Edit, Trash2, Eye, MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PartyList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "partyId",
    direction: "desc",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [actionMenu, setActionMenu] = useState(null); // { id: partyId, top, left }

  // THEME
  const getTheme = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("materio-mui-template-mode") || "light";
    }
    return "light";
  };
  const [theme, setTheme] = useState("light");
  useEffect(() => setTheme(getTheme()), []);

  // LOAD LIST
  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction,
        search,
        partyType: partyTypeFilter,
      });

      const res = await fetch(`/api/party/list?${params}`);
      const data = await res.json();

      setItems(data.parties || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.limit, sortConfig]);

  useEffect(() => {
    function handleClickOutside() { setActionMenu(null); }
    if (actionMenu != null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [actionMenu]);

  useEffect(() => {
    if (actionMenu == null) return;
    const close = () => setActionMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [actionMenu]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadData();
  };

  // DELETE
  const handleDelete = async (partyId) => {
    if (!confirm("Are you sure you want to delete this party?")) return;

    try {
      const res = await fetch(`/api/party/list`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Successfully deleted");
        loadData();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              Party List
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Manage Businesses, Corporations, Government Agencies, CSO, Individuals
            </p>
          </div>

          <Link
            href="/party/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New
          </Link>
        </div>

        {/* Search + Filter */}
        <div
          className={`p-4 rounded-lg mb-6 border shadow-sm ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                placeholder="Search party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* PARTY TYPE FILTER */}
            <select
              value={partyTypeFilter}
              onChange={(e) => setPartyTypeFilter(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            >
              <option value="">All Types</option>
              <option value="BUSINESS">Business</option>
              <option value="GOVERNMENT_AGENCY">Government Agency</option>
              <option value="CORPORATION">Corporation</option>
              <option value="CSO">CSO</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>

            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center">
              <Search className="w-5 h-5 mr-2" /> Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div
          className={`table-list-card-shell rounded-lg border shadow-sm ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
          }`}
        >
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin h-8 w-8 border-2 border-b-transparent rounded-full border-blue-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 flex justify-center items-center text-gray-500">No records found</div>
          ) : (
            <>
              <div className="table-list-scroll-x rounded-t-lg">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className={`${theme === "dark" ? "bg-gray-900 bg-opacity-40" : "bg-gray-100"} border-b`}>
                      
                      {[
                        { key: "partyId", label: "Sl No.", width: "w-20" },
                        { key: "displayName", label: "Name", width: "w-64" },
                        { key: "partyType", label: "Type", width: "w-48" },
                        { key: "status", label: "Status", width: "w-32" },
                        { key: "createdAt", label: "Created", width: "w-40" },
                        { key: "actions", label: "", width: "w-24" },
                      ].map(({ key, label, width }) => (
                        <th
                          key={key}
                          className={`${width} px-6 py-4 text-left font-semibold ${
                            key !== "actions" ? "cursor-pointer" : ""
                          }`}
                          onClick={() => key !== "actions" && handleSort(key)}
                        >
                          <div className="flex items-center">
                            {label}
                            {key !== "actions" && getSortIcon(key)}
                          </div>
                        </th>
                      ))}

                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.partyId}
                        className={`hover:${
                          theme === "dark" ? "bg-gray-750" : "bg-gray-50"
                        } transition-colors`}
                      >
                        <td className="px-6 py-4">#{item.partyId}</td>
                        <td className="px-6 py-4">{item.displayName}</td>
                        <td className="px-6 py-4 capitalize">{item.partyType.replace("_", " ")}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.status === "A"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {item.status === "A" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuWidth = 160;
                              setActionMenu((prev) =>
                                prev?.id === item.partyId
                                  ? null
                                  : { id: item.partyId, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                              );
                            }}
                            className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                            aria-label="Actions"
                            aria-expanded={actionMenu?.id === item.partyId}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`px-6 py-4 flex justify-between items-center border-t rounded-b-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <div>
                  Showing{" "}
                  <b>{(pagination.page - 1) * pagination.limit + 1}</b> –{" "}
                  <b>{Math.min(pagination.page * pagination.limit, pagination.total)}</b>{" "}
                  of <b>{pagination.total}</b>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    className="px-3 py-2 border rounded disabled:opacity-40"
                  >
                    ←
                  </button>

                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= pagination.totalPages - 2)
                      pageNum = pagination.totalPages - 4 + i;
                    else pageNum = pagination.page - 2 + i;

                    return (
                      <button
                        key={i}
                        className={`px-4 py-2 rounded ${
                          pageNum === pagination.page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200"
                        }`}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: pageNum }))
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    className="px-3 py-2 border rounded disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const row = items.find((i) => i.partyId === actionMenu.id);
            if (!row) return null;
            const dark = theme === "dark";
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={(e) => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/party/view/${row.partyId}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> View
                </Link>
                <Link
                  href={`/party/edit/${row.partyId}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionMenu(null);
                    handleDelete(row.partyId);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700 hover:text-red-400" : "text-gray-700 hover:bg-gray-100 hover:text-red-600"}`}
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /> Delete
                </button>
              </div>,
              document.body
            );
          })()}

        {/* Rows per page */}
        <div className="mt-4 flex justify-end items-center gap-3">
          <span>Rows per page:</span>
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination((prev) => ({
                ...prev,
                limit: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="px-3 py-2 border rounded"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
