import { DataTable } from "@/components/DataTable";
import { IndeterminateCheckbox } from "@/components/IntermidateCheckBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { CloudDownload, CloudUpload, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  exportCustomers,
  getCustomers,
  importCustomers,
} from "./api/customerAPI";
import type { Customer } from "./constants/customer";
import DetailCustomer from "./DetailCustomer";
import NewCustomer from "./NewCustomer";
import UpdateCustomer from "./UpdateCustomer";

const ListCustomers = () => {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchValue, setSearchValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    fetchCustomers();
  }, [searchValue]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchValue) params.append("search", searchValue);
      if (pagination) {
        params.append("page", (pagination.pageIndex + 1).toString());
        params.append("limit", pagination.pageSize.toString());
      }

      const response = await getCustomers(params.toString());

      setCustomers(response.customers);
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setLoading(false);
    }
  };
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ... existing functions ...
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportCustomers();

      // Check if we have data
      if (response.data.size === 0) {
        alert("No customer data available to export");
        return;
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `customers-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("Customers exported successfully!");
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is Excel
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please select a file smaller than 10MB.");
      return;
    }

    try {
      setImporting(true);
      const result = await importCustomers(file);

      if (result.success) {
        alert(`Successfully imported ${result.importedCount} customers!`);
        if (result.errors.length > 0) {
          console.warn("Import warnings:", result.errors);
          // Show first 5 errors if there are many
          const errorPreview = result.errors.slice(0, 5).join("\n");
          if (result.errors.length > 5) {
            alert(
              `Import completed with ${
                result.errorCount
              } errors. First 5 errors:\n${errorPreview}\n... and ${
                result.errors.length - 5
              } more. Check console for details.`
            );
          } else {
            alert(
              `Import completed with ${result.errorCount} errors:\n${errorPreview}`
            );
          }
        }
        // Refresh the customer list
        fetchCustomers();
      } else {
        alert("Import failed: " + (result.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Import failed:", error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) =>
          !row.original?.empty_row && (
            <IndeterminateCheckbox
              checked={row.getIsSelected()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          ),
        size: 40,
      },
      {
        header: "Customer Name",
        accessorKey: "name",
      },
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Phone",
        accessorKey: "phone",
      },
      {
        header: "Address",
        accessorKey: "address",
        cell: ({ row }) => (
          <div className="truncate max-w-xs">{row.original.address}</div>
        ),
      },
      {
        header: "Company Name",
        accessorKey: "companyName",
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const supplier = row.original;
          return (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(supplier);
                  setIsDetailDialogOpen(true);
                }}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(supplier);
                  setIsEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1"
            onClick={handleExport}
            disabled={exporting || customers.length === 0}
          >
            <CloudDownload className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            variant="outline"
            className="gap-1"
            onClick={handleImportClick}
            disabled={importing}
          >
            <CloudUpload className="w-4 h-4" />
            {importing ? "Importing..." : "Import"}
          </Button>
          <Button onClick={() => setIsNewDialogOpen(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
      />

      <Card className="shadow-md bg-white dark:bg-gray-800">
        <CardContent className="pt-6">
          <DataTable
            data={customers || []}
            columns={columns}
            tableCaption="List of Customers"
            sorting={sorting}
            setSorting={setSorting}
            pagination={pagination}
            setPagination={setPagination}
            backendPagSorting={false}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </CardContent>
      </Card>

      <NewCustomer open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      {selectedCustomer && (
        <>
          <UpdateCustomer
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            customer={selectedCustomer}
          />
          <DetailCustomer
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            customer={selectedCustomer}
          />
        </>
      )}
    </div>
  );
};

export default ListCustomers;
