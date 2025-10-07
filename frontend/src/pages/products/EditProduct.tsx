import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, Form, Formik } from "formik";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { getCategories } from "../categories/api/categoryAPI";
import { getSuppliers } from "../suppliers/api/supplierAPI";
import { GetProductByID, updateProduct } from "./api/productAPI";
import type { Product } from "./constants/product";

const validationSchema = Yup.object({
  name: Yup.string().required("Product name is required"),
  description: Yup.string().required("Description is required"),
  price: Yup.number()
    .required("Price is required")
    .positive("Price must be positive"),
  supplierPrice: Yup.number()
    .required("Supplier price is required")
    .positive("Supplier price must be positive"),
  stock: Yup.number()
    .required("Stock is required")
    .integer("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  expiryDate: Yup.date().required("Expiry date is required"),
  packageSize: Yup.string().required("Package size is required"),
  categoryId: Yup.string().required("Category is required"),
  supplierId: Yup.string().required("Supplier is required"),
});

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productData, categoriesRes, suppliersRes] = await Promise.all([
        GetProductByID(id!),
        getCategories(),
        getSuppliers(),
      ]);

      setProduct(productData.product);
      setCategories(categoriesRes.categories || categoriesRes);
      setSuppliers(suppliersRes.suppliers || suppliersRes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();

      // Append all form fields
      Object.keys(values).forEach((key) => {
        formData.append(key, values[key]);
      });

      // Append image file if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await updateProduct(id!, formData);
      navigate("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
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

      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              name: product.name,
              brandName: product.brandName || "",
              description: product.description,
              manufacturer: product.manufacturer || "",
              price: product.price,
              supplierPrice: product.supplierPrice,
              expiryDate: new Date(product.expiryDate)
                .toISOString()
                .split("T")[0],
              stock: product.stock,
              packageSize: product.packageSize,
              categoryId: product.categoryId._id || product.categoryId,
              supplierId: product.supplierId._id || product.supplierId,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Field
                      as={Input}
                      id="name"
                      name="name"
                      placeholder="Enter product name"
                    />
                    {errors.name && touched.name && (
                      <div className="text-red-500 text-sm">{errors.name}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Field
                      as={Input}
                      id="brandName"
                      name="brandName"
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Field
                      as={Textarea}
                      id="description"
                      name="description"
                      placeholder="Enter product description"
                      rows={3}
                    />
                    {errors.description && touched.description && (
                      <div className="text-red-500 text-sm">
                        {errors.description}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Field
                      as={Input}
                      id="manufacturer"
                      name="manufacturer"
                      placeholder="Enter manufacturer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Field
                      as={Input}
                      id="price"
                      name="price"
                      type="number"
                      placeholder="Enter price"
                    />
                    {errors.price && touched.price && (
                      <div className="text-red-500 text-sm">{errors.price}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="supplierPrice">Supplier Price</Label>
                    <Field
                      as={Input}
                      id="supplierPrice"
                      name="supplierPrice"
                      type="number"
                      placeholder="Enter supplier price"
                    />
                    {errors.supplierPrice && touched.supplierPrice && (
                      <div className="text-red-500 text-sm">
                        {errors.supplierPrice}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Field
                      as={Input}
                      id="stock"
                      name="stock"
                      type="number"
                      placeholder="Enter stock quantity"
                    />
                    {errors.stock && touched.stock && (
                      <div className="text-red-500 text-sm">{errors.stock}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Field
                      as={Input}
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                    />
                    {errors.expiryDate && touched.expiryDate && (
                      <div className="text-red-500 text-sm">
                        {errors.expiryDate}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="packageSize">Package Size</Label>
                    <Select
                      value={values.packageSize}
                      onValueChange={(value) =>
                        setFieldValue("packageSize", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="bottle">bottle</SelectItem>
                        <SelectItem value="pack">pack</SelectItem>
                        <SelectItem value="unit">unit</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.packageSize && touched.packageSize && (
                      <div className="text-red-500 text-sm">
                        {errors.packageSize}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      value={values.categoryId}
                      onValueChange={(value) =>
                        setFieldValue("categoryId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && touched.categoryId && (
                      <div className="text-red-500 text-sm">
                        {errors.categoryId}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="supplierId">Supplier</Label>
                    <Select
                      value={values.supplierId}
                      onValueChange={(value) =>
                        setFieldValue("supplierId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier: any) => (
                          <SelectItem key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.supplierId && touched.supplierId && (
                      <div className="text-red-500 text-sm">
                        {errors.supplierId}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="image">Product Image</Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    {product.image && !imageFile && (
                      <div className="mt-2">
                        <img
                          src={`https://pharma-inventory-3.onrender.com//${product.image}`}
                          alt={product.name}
                          className="h-20 w-20 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/products")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Product"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProduct;
