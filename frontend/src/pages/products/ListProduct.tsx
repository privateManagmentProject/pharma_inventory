import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, getProducts } from "./api/productAPI";
import type { Product } from "./constants/product";

const ListProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSupplier) params.append("supplier", selectedSupplier);

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

  const handleFilter = () => {
    fetchProducts();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link to="/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSupplier}
              onValueChange={setSelectedSupplier}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleFilter}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    {product.image && (
                      <img
                        src={`http://localhost:5000/${product.image}`}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.categoryId?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.supplierId?.name || "N/A"}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        parseInt(product.stock) > 10 ? "default" : "destructive"
                      }
                    >
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(product.expiryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link to={`/products/${product._id}`}>
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/products/edit/${product._id}`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(product._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length === 0 && (
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
