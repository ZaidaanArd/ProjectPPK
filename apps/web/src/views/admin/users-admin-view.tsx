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

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Akun & verifikasi"
        title="Pastikan hanya pengguna sah yang masuk."
        description="Admin dapat membuat akun langsung atau memverifikasi registrasi mandiri."
        action={<Button>Daftarkan akun</Button>}
      />
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Keputusan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Nadia Permata</TableCell>
                <TableCell>nadia@kampus.ac.id</TableCell>
                <TableCell>Pengguna</TableCell>
                <TableCell>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                    Menunggu
                  </span>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button variant="outline" size="sm">
                    Tolak
                  </Button>
                  <Button size="sm">Verifikasi</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
