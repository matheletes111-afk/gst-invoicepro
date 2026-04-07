// src/app/(dashboard)/role/permissions/[id]/page.jsx
"use client"

import { useParams } from "next/navigation"
import RolePermissions from "@/views/role/Permissions"

export default function PermissionsPage() {
  const params = useParams()
  return <RolePermissions roleId={params.id} />
}