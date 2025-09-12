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
      <DialogContent className="sm:max-w-lg">
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
            <h3 className="font-semibold">Description</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {supplier.description || "No description provided"}
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
              {supplier.licenses && supplier.licenses.length > 0 ? (
                supplier.licenses.map((license, index) => (
                  <a
                    key={index}
                    href={`http://localhost:5000/${license.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline"
                  >
                    {license.name} ({license.type})
                  </a>
                ))
              ) : (
                <p>No licenses uploaded</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Accounts</h3>
            <div className="text-gray-700 dark:text-gray-300">
              {supplier.accounts && supplier.accounts.length > 0 ? (
                supplier.accounts.map((account, index) => (
                  <div key={index} className="mb-2">
                    <p>
                      {account.name} - {account.number}
                      {account.isDefault && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p>No accounts added</p>
              )}
            </div>
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
