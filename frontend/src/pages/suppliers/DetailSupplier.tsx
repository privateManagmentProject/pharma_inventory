import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, FileText } from "lucide-react";
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
      <DialogContent className="sm:max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Supplier Details
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            View supplier information
          </DialogDescription>
        </DialogHeader>
        <Card className="border-0">
          <CardContent className="space-y-6 pt-4">
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Name
                </CardTitle>
              </CardHeader>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {supplier.name}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Email
                </CardTitle>
              </CardHeader>
              <p className="text-gray-700 dark:text-gray-300">
                {supplier.email}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Phone
                </CardTitle>
              </CardHeader>
              <p className="text-gray-700 dark:text-gray-300">
                {supplier.phone}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Address
                </CardTitle>
              </CardHeader>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {supplier.address}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Description
                </CardTitle>
              </CardHeader>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {supplier.description || "No description provided"}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  TIN Number
                </CardTitle>
              </CardHeader>
              <p className="text-gray-700 dark:text-gray-300">
                {supplier.tinNumber}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Licenses
                </CardTitle>
              </CardHeader>
              <div className="text-gray-700 dark:text-gray-300">
                {supplier.licenses && supplier.licenses.length > 0 ? (
                  <ul className="space-y-2">
                    {supplier.licenses.map((license, index) => (
                      <li key={index}>
                        <a
                          href={`http://localhost:5000/${license.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {license.name} ({license.type})
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No licenses uploaded</p>
                )}
              </div>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Accounts
                </CardTitle>
              </CardHeader>
              <div className="text-gray-700 dark:text-gray-300">
                {supplier.accounts && supplier.accounts.length > 0 ? (
                  <ul className="space-y-2">
                    {supplier.accounts.map((account, index) => (
                      <li key={index} className="flex items-center">
                        <p>
                          {account.name} - {account.number}
                          {account.isDefault && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No accounts added</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 py-2 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailSupplier;
