import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { PageHeading } from "@/components/page-heading"
import { StatusPill } from "@/components/status-pill"
import { facilities } from "@/mocks/facilities"

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Master fasilitas"
        title="Data ruang dan status operasional."
        description="Tambah, ubah, nonaktifkan, atau tandai fasilitas yang sedang diperbaiki."
        action={<Button>Tambah fasilitas</Button>}
      />
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fasilitas</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableCell>
                    <p className="font-semibold">{facility.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {facility.type}
                    </p>
                  </TableCell>
                  <TableCell>{facility.location}</TableCell>
                  <TableCell>{facility.capacity}</TableCell>
                  <TableCell>
                    <StatusPill status={facility.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
