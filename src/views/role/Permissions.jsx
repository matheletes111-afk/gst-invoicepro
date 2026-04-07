// src/views/role/Permissions.jsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, Save, X } from "lucide-react"

import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import CardHeader from "@mui/material/CardHeader"
import CardContent from "@mui/material/CardContent"
import { Checkbox, FormControlLabel, CircularProgress, Divider } from "@mui/material"

import Link from "next/link"
import { toast } from "sonner"

export default function RolePermissions({ roleId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState(null)
  const [modules, setModules] = useState([])
  const [selectedMenus, setSelectedMenus] = useState(new Set())
  const [expandedModules, setExpandedModules] = useState(new Set())

  // Fetch role and permissions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch role details
        const roleRes = await fetch(`/api/role/${roleId}`)
        const roleData = await roleRes.json()

        if (!roleData.success) {
          toast.error("Role not found")
          router.push("/role")
          return
        }

        setRole(roleData.data)

        // Fetch modules with menus
        const modulesRes = await fetch("/api/menu-modules/with-menus")
        const modulesData = await modulesRes.json()

        if (modulesData.success) {
          setModules(modulesData.data)
        }

        // Fetch role permissions
        const permissionsRes = await fetch(`/api/role/${roleId}/permissions`)
        const permissionsData = await permissionsRes.json()

        if (permissionsData.success) {
          const menuIds = permissionsData.data.map(p => p.menuId)
          setSelectedMenus(new Set(menuIds))
        }

      } catch (err) {
        console.error(err)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [roleId, router])

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const toggleMenu = (menuId) => {
    setSelectedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(menuId)) {
        newSet.delete(menuId)
      } else {
        newSet.add(menuId)
      }
      return newSet
    })
  }

  const toggleAllInModule = (module, checked) => {
    setSelectedMenus(prev => {
      const newSet = new Set(prev)
      module.menus.forEach(menu => {
        if (checked) {
          newSet.add(menu.id)
        } else {
          newSet.delete(menu.id)
        }
      })
      return newSet
    })
  }

  const isModuleFullySelected = (module) => {
    return module.menus.every(menu => selectedMenus.has(menu.id))
  }

  const isModulePartiallySelected = (module) => {
    const selectedCount = module.menus.filter(menu => selectedMenus.has(menu.id)).length
    return selectedCount > 0 && selectedCount < module.menus.length
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/role/${roleId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuIds: Array.from(selectedMenus)
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Permissions saved successfully")
        router.push("/role")
      } else {
        toast.error(data.error || "Failed to save permissions")
      }
    } catch (err) {
      toast.error("Error saving permissions")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader 
        title={`Manage Permissions - ${role?.roleName}`}
        subheader="Select menus to assign permissions to this role"
      />
      <CardContent>
        <Grid container spacing={3}>
          {modules.map((module) => (
            <Grid item xs={12} key={module.id}>
              <div className="border rounded-lg overflow-hidden">
                {/* Module Header */}
                <div 
                  className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                    expandedModules.has(module.id) ? "border-b" : ""
                  }`}
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="mr-2">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isModuleFullySelected(module)}
                        indeterminate={isModulePartiallySelected(module)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleAllInModule(module, e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={
                      <Typography variant="subtitle1" className="font-semibold">
                        {module.moduleName}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" color="textSecondary" className="ml-2">
                    ({module.menus.length} menus)
                  </Typography>
                </div>

                {/* Module Menus */}
                {expandedModules.has(module.id) && (
                  <div className="p-4 pl-12 bg-gray-50">
                    <Grid container spacing={2}>
                      {module.menus.map((menu) => (
                        <Grid item xs={12} sm={6} md={4} key={menu.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedMenus.has(menu.id)}
                                onChange={() => toggleMenu(menu.id)}
                                size="small"
                              />
                            }
                            label={
                              <div>
                                <Typography variant="body2" className="font-medium">
                                  {menu.menuName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {menu.menuEndPoint}
                                </Typography>
                              </div>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </div>
                )}
              </div>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Divider className="my-4" />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="textSecondary">
                  Selected {selectedMenus.size} menu(s)
                </Typography>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? "Saving..." : "Save Permissions"}
                </Button>
                <Link href="/role" passHref>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<X className="w-4 h-4" />}
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}