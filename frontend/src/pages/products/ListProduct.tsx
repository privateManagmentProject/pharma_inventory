import { DataTable } from "@/components/DataTable";
import { IndeterminateCheckbox } from "@/components/IntermidateCheckBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteProduct, getProducts } from "./api/productAPI";
import type { Product } from "./constants/product";

const ListProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchProducts();
  }, [searchValue]);

  useEffect(() => {
    applyFilters();
  }, [filters, products]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchValue) params.append("search", searchValue);
      if (pagination) {
        params.append("page", (pagination.pageIndex + 1).toString());
        params.append("limit", pagination.pageSize.toString());
      }

      const response = await getProducts(params.toString());
      setProducts(response.products);
      setCategories(response.categories);
      setSuppliers(response.suppliers);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((product) =>
        product.categoryId?.categoryName
          ?.toLowerCase()
          .includes(filters.category.toLowerCase())
      );
    }

    // Apply supplier filter
    if (filters.supplier) {
      filtered = filtered.filter((product) =>
        product.supplierId?.name
          ?.toLowerCase()
          .includes(filters.supplier.toLowerCase())
      );
    }

    // Apply price filter
    if (filters.minPrice) {
      filtered = filtered.filter(
        (product) => parseFloat(product.price) >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (product) => parseFloat(product.price) <= parseFloat(filters.maxPrice)
      );
    }

    // Apply stock filter
    if (filters.stockStatus === "low") {
      filtered = filtered.filter((product) => parseInt(product.stock) <= 10);
    } else if (filters.stockStatus === "out") {
      filtered = filtered.filter((product) => parseInt(product.stock) === 0);
    } else if (filters.stockStatus === "available") {
      filtered = filtered.filter((product) => parseInt(product.stock) > 0);
    }

    // Apply date filter
    if (filters.startDate) {
      filtered = filtered.filter(
        (product) => new Date(product.createdAt) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (product) => new Date(product.createdAt) <= endDate
      );
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        fetchProducts(); // Refresh the list
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const filterOptions = {
    category: {
      type: "text" as const,
      placeholder: "Filter by category",
    },
    supplier: {
      type: "text" as const,
      placeholder: "Filter by supplier",
    },
    minPrice: {
      type: "number" as const,
      placeholder: "Min price",
    },
    maxPrice: {
      type: "number" as const,
      placeholder: "Max price",
    },
    stockStatus: {
      type: "select" as const,
      options: [
        { label: "Low stock (≤10)", value: "low" },
        { label: "Out of stock", value: "out" },
        { label: "Available", value: "available" },
      ],
      placeholder: "Stock status",
    },
    startDate: {
      type: "date" as const,
      placeholder: "From date",
    },
    endDate: {
      type: "date" as const,
      placeholder: "To date",
    },
  };

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 40,
    },
    {
      header: "Image",
      accessorKey: "image",
      cell: ({ row }) => (
        <img
          src={`https://pharma-inventory-3.onrender.com//${row.original.image}`}
          alt={row.original.name}
          className="h-10 w-10 object-cover rounded"
        />
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Category",
      accessorKey: "categoryId.categoryName",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.categoryId?.categoryName || "N/A"}
        </Badge>
      ),
    },
    {
      header: "Supplier",
      accessorKey: "supplierId.name",
      cell: ({ row }) => row.original.supplierId?.name || "N/A",
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }) => `$${row.original.price}`,
    },
    {
      header: "Stock",
      accessorKey: "stock",
      cell: ({ row }) => (
        <Badge
          variant={parseInt(row.original.stock) > 1 ? "default" : "destructive"}
        >
          {row.original.stock}
        </Badge>
      ),
    },
    {
      header: "Expiry Date",
      accessorKey: "expiryDate",
      cell: ({ row }) => new Date(row.original.expiryDate).toLocaleDateString(),
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`${product._id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`edit/${product._id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(product._id!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => navigate("new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="shadow-md bg-white dark:bg-gray-800">
        <CardContent className="p-0">
          <DataTable
            data={filteredProducts}
            columns={columns}
            tableCaption="List of products"
            sorting={sorting}
            setSorting={setSorting}
            pagination={pagination}
            setPagination={setPagination}
            backendPagSorting={false}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search products..."
            filterOptions={filterOptions}
            onFilterChange={setFilters}
            activeFilters={filters}
          />
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListProduct;
