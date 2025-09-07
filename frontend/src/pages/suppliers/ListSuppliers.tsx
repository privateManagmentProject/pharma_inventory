import { DataTable } from "@/components/DataTable";
import { IndeterminateCheckbox } from "@/components/IntermidateCheckBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSuppliers } from "./api/supplierAPI";
import type { Supplier } from "./constants/supplier";
import DetailSupplier from "./DetailSupplier";
import NewSuplier from "./NewSuplier";
import UpdateSupplier from "./UpdateSuplier";

const ListSuppliers = () => {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  useEffect(() => {
    fetchSuppliers();
  }, [searchValue]);

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchValue) params.append("search", searchValue);
      if (pagination) {
        params.append("page", (pagination.pageIndex + 1).toString());
        params.append("limit", pagination.pageSize.toString());
      }

      const response = await getSuppliers(params.toString());

      setSuppliers(response.suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
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
        header: "Supplier Name",
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
        header: "TIN Number",
        accessorKey: "tinNumber",
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
                  setSelectedSupplier(supplier);
                  setIsDetailDialogOpen(true);
                }}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSupplier(supplier);
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
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Button onClick={() => setIsNewDialogOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      <Card className="shadow-md bg-white dark:bg-gray-800">
        <CardContent className="pt-6">
          {/* <DataTable
            data={categories || []}
            columns={columns}
            tableCaption="List of categories"
          /> */}
          <DataTable
            data={suppliers || []}
            columns={columns}
            tableCaption="List of Suppliers"
            sorting={sorting}
            setSorting={setSorting}
            pagination={pagination}
            setPagination={setPagination}
            backendPagSorting={false}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            // addButton={
            //   <Button variant="outline" className="gap-1">
            //     <CloudDownload className="w-4 h-4" />
            //     Export
            //   </Button>
            // }
          />
        </CardContent>
      </Card>

      <NewSuplier open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      {selectedSupplier && (
        <>
          <UpdateSupplier
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            supplier={selectedSupplier}
          />
          <DetailSupplier
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            supplier={selectedSupplier}
          />
        </>
      )}
    </div>
  );
};

export default ListSuppliers;
