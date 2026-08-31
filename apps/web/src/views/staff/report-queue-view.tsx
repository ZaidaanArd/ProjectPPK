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

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Antrean laporan"
        title="Tangani kerusakan secara terukur."
        description="Tandai fasilitas dalam perbaikan selama masalah ditangani dan tutup laporan dengan catatan resolusi."
      />
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laporan</TableHead>
                <TableHead>Fasilitas</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <p className="font-mono text-xs font-bold">RPT-0118</p>
                  <p className="text-xs text-muted-foreground">
                    Proyektor tidak menampilkan gambar
                  </p>
                </TableCell>
                <TableCell className="font-semibold">Ruang Arunika</TableCell>
                <TableCell>Perangkat</TableCell>
                <TableCell>
                  <StatusPill status="in_progress" />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Buka
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
