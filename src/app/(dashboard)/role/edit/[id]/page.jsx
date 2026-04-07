// src/app/(dashboard)/role/edit/[id]/page.jsx
"use client"

import { useParams } from "next/navigation"
import EditRole from "@/views/role/Edit"

export default function EditRolePage() {
  const params = useParams()
  return <EditRole id={params.id} />
}