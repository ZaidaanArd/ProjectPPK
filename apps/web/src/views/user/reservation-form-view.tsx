import { zodResolver } from "@hookform/resolvers/zod"
import {
  reservationInputSchema,
  type ReservationInput,
} from "@workspace/contracts"
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
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationInputSchema),
    defaultValues: { facilityId: "019908f4-72b1-7000-8000-000000000001" },
  })

  return (
    <div className="page-enter grid max-w-3xl gap-8">
      <PageHeading
        eyebrow="Form reservasi"
        title="Ajukan slot penggunaan."
        description="Waktu wajib berada pada 07.00–20.00 WIB dan menggunakan kelipatan 30 menit."
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
              label="Tujuan penggunaan"
              htmlFor="purpose"
              error={errors.purpose?.message}
            >
              <Textarea
                id="purpose"
                placeholder="Jelaskan kegiatan yang akan dilakukan..."
                {...register("purpose")}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Waktu mulai (ISO)"
                htmlFor="start"
                error={errors.startTime?.message}
              >
                <Input
                  id="start"
                  placeholder="2026-09-01T03:00:00.000Z"
                  {...register("startTime")}
                />
              </FormField>
              <FormField
                label="Waktu selesai (ISO)"
                htmlFor="end"
                error={errors.endTime?.message}
              >
                <Input
                  id="end"
                  placeholder="2026-09-01T04:30:00.000Z"
                  {...register("endTime")}
                />
              </FormField>
            </div>
            <Button type="submit">Validasi pengajuan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
