import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";
import { GetProductByID } from "./api/productAPI";
import type { Product } from "./constants/product";

const DetailProduct = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const productData = await GetProductByID(id!);
      setProduct(productData.product);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link to="/products">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Name</h3>
              <p>{product.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Brand</h3>
              <p>{product.brandName || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Description</h3>
              <p>{product.description}</p>
            </div>
            <div>
              <h3 className="font-semibold">Manufacturer</h3>
              <p>{product.manufacturer || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Price</h3>
              <p>${product.price}</p>
            </div>
            <div>
              <h3 className="font-semibold">Supplier Price</h3>
              <p>${product.supplierPrice}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Stock</h3>
              <Badge
                variant={
                  parseInt(product.stock) > 10 ? "default" : "destructive"
                }
              >
                {product.stock}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">Package Size</h3>
              <Badge variant="outline">{product.packageSize}</Badge>
            </div>
            <div>
              <h3 className="font-semibold">Expiry Date</h3>
              <p>{new Date(product.expiryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Category</h3>
              <p>{product.categoryId?.name || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Supplier</h3>
              <p>{product.supplierId?.name || "N/A"}</p>
            </div>
            {product.image && (
              <div>
                <h3 className="font-semibold">Product Image</h3>
                <img
                  src={`http://localhost:5000/${product.image}`}
                  alt={product.name}
                  className="h-40 w-40 object-cover rounded mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DetailProduct;
