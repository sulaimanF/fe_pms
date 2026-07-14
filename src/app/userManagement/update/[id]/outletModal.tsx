"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface Outlet {
  id: number;
  nama: string;
  tipe: string;
}

interface Props {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  data: Outlet[];
  selected: number[];
  setSelected: React.Dispatch<React.SetStateAction<number[]>>;
}

export default function OutletModal({
  open,
  onOpenChange,
  data,
  selected,
  setSelected,
}: Props) {
  const handleChecked = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Outlet Kelolaan</DialogTitle>
        </DialogHeader>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="w-10"></th>
              <th className="text-left">Nama Outlet</th>
              <th className="text-left">Tipe Outlet</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => handleChecked(item.id)}
                  />
                </td>
                <td>{item.nama}</td>
                <td>{item.tipe}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}