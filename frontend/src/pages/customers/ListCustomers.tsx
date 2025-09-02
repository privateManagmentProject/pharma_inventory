import { DataTable } from "@/components/DataTable";
import { IndeterminateCheckbox } from "@/components/IntermidateCheckBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer } from "./constants/customer";
import { useCustomers } from "./constants/customer-hooks";
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

  const { data: customers, isLoading } = useCustomers();
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setIsNewDialogOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Customer
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
            data={customers.customers || []}
            columns={columns}
            tableCaption="List of Customers"
            sorting={sorting}
            setSorting={setSorting}
            pagination={pagination}
            setPagination={setPagination}
            backendPagSorting={false}
            // addButton={
            //   <Button variant="outline" className="gap-1">
            //     <CloudDownload className="w-4 h-4" />
            //     Export
            //   </Button>
            // }
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
