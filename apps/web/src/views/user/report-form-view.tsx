"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { reportInputSchema, type ReportInput } from "@workspace/contracts"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/form-field"
import { PageHeading } from "@/components/page-heading"

export function Component() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportInputSchema),
    defaultValues: { facilityId: "019908f4-72b1-7000-8000-000000000001" },
  })

  return (
    <div className="page-enter grid max-w-3xl gap-8">
      <PageHeading
        eyebrow="Form laporan"
        title="Laporkan masalah fasilitas."
        description="Tambahkan kategori dan deskripsi yang cukup agar petugas dapat menindaklanjuti."
      />
      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit(() => undefined)}
            className="grid gap-5"
            noValidate
          >
            <input type="hidden" {...register("facilityId")} />
            <FormField
              label="Kategori"
              htmlFor="category"
              error={errors.category?.message}
            >
              <Input
                id="category"
                placeholder="Perangkat, kebersihan, keamanan..."
                {...register("category")}
              />
            </FormField>
            <FormField
              label="Deskripsi"
              htmlFor="description"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                rows={6}
                placeholder="Jelaskan kondisi, lokasi tepat, dan dampaknya..."
                {...register("description")}
              />
            </FormField>
            <Button type="submit">Validasi laporan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
