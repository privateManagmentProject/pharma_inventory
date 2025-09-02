import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Supplier } from "./constants/supplier";

interface DetailSupplierProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
}

const DetailSupplier: React.FC<DetailSupplierProps> = ({
  open,
  onOpenChange,
  supplier,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supplier Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Name</h3>
            <p className="text-gray-700 dark:text-gray-300">{supplier.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Email</h3>
            <p className="text-gray-700 dark:text-gray-300">{supplier.email}</p>
          </div>
          <div>
            <h3 className="font-semibold">Phone</h3>
            <p className="text-gray-700 dark:text-gray-300">{supplier.phone}</p>
          </div>
          <div>
            <h3 className="font-semibold">Address</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {supplier.address}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">TIN Number</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {supplier.tinNumber}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Licenses</h3>
            <div className="text-gray-700 dark:text-gray-300">
              {supplier.licenses.map((license, index) => (
                <a
                  key={index}
                  href={`http://localhost:5000/${license.path}`} // Adjust URL as needed
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  {license.name} ({license.type})
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Account Name</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {supplier.account.name}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Account Number</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {supplier.account.number}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default DetailSupplier;
