import { DataTable } from "@/components/DataTable";
import { IndeterminateCheckbox } from "@/components/IntermidateCheckBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import DetailCategory from "./DetailCategory";
import NewCategory from "./NewCategory";
import UpdateCategory from "./UpdateCategory";
import { useCategories } from "./constants/category-hooks";
import type { Category } from "./constants/catgory";

const ListCategory = () => {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: categories, isLoading } = useCategories();
  console.log("data", categories);
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
        header: "Category Name",
        accessorKey: "categoryName",
      },
      {
        header: "Description",
        accessorKey: "categoryDescription",
        cell: ({ row }) => (
          <div className="truncate max-w-xs">
            {row.original.categoryDescription}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory(category);
                  setIsDetailDialogOpen(true);
                }}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory(category);
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
          Add Category
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
            data={categories.categories || []}
            columns={columns}
            tableCaption="List of categories"
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

      <NewCategory open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      {selectedCategory && (
        <>
          <UpdateCategory
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            category={selectedCategory}
          />
          <DetailCategory
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            category={selectedCategory}
          />
        </>
      )}
    </div>
  );
};

export default ListCategory;
