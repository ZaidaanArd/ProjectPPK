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

const queue = [
  {
    id: "RSV-0269",
    user: "Alya Rahman",
    facility: "Aula Nawasena",
    time: "01 Sep · 13.00–15.00",
  },
  {
    id: "RSV-0270",
    user: "Dimas Yoga",
    facility: "Lab Cakrawala",
    time: "02 Sep · 09.00–11.00",
  },
]

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Antrean reservasi"
        title="Tinjau sebelum menyetujui."
        description="Server akan memeriksa bentrok kembali secara transaksional ketika keputusan dikirim."
      />
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Fasilitas & waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-bold">
                    {item.id}
                  </TableCell>
                  <TableCell className="font-semibold">{item.user}</TableCell>
                  <TableCell>
                    <p className="font-medium">{item.facility}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </TableCell>
                  <TableCell>
                    <StatusPill status="pending" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Tinjau
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
