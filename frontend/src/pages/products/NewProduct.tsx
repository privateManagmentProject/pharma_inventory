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
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { getCategories } from "../categories/api/categoryAPI";
import { getSuppliers } from "../suppliers/api/supplierAPI";
import { addProduct } from "./api/productAPI";

const validationSchema = Yup.object({
  name: Yup.string().required("Product name is required"),
  description: Yup.string().required("Description is required"),
  soldPrice: Yup.number()
    .required("Sold price is required")
    .positive("Sold price must be positive"),
  purchasePrice: Yup.number()
    .required("Purchase price is required")
    .positive("Purchase price must be positive"),
  stock: Yup.number()
    .required("Stock is required")
    .integer("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  expiryDate: Yup.date()
    .required("Expiry date is required")
    .min(new Date(), "Expiry date must be in the future"),
  packageSize: Yup.string().required("Package size is required"),
  categoryId: Yup.string().required("Category is required"),
  supplierId: Yup.string().required("Supplier is required"),
});

const NewProduct = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories and suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, suppliersRes] = await Promise.all([
          getCategories(),
          getSuppliers(),
        ]);
        setCategories(categoriesRes.categories || categoriesRes);
        setSuppliers(suppliersRes.suppliers || suppliersRes);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Append all form fields
      Object.keys(values).forEach((key) => {
        if (
          values[key] !== undefined &&
          values[key] !== null &&
          values[key] !== ""
        ) {
          formData.append(key, values[key]);
        }
      });

      // Append image file if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Only call addProduct for new product creation
      await addProduct(formData);

      navigate("/admin/products");
    } catch (error: any) {
      console.error("Error adding product:", error);
      alert(error.response?.data?.message || "Error adding product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

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
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              name: "",
              brandName: "",
              brandRate: "good",
              description: "",
              manufacturer: "",
              soldPrice: "",
              purchasePrice: "",
              expiryDate: "",
              stock: "",
              packageSize: "",
              cartonSize: "",
              categoryId: "",
              supplierId: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue }) => (
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
                    <Label htmlFor="brandRate">Brand Rate</Label>
                    <Select
                      onValueChange={(value) =>
                        setFieldValue("brandRate", value)
                      }
                      defaultValue="good"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="very good">Very Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="soldPrice">Sold Price</Label>
                    <Field
                      as={Input}
                      id="soldPrice"
                      name="soldPrice"
                      type="number"
                      placeholder="Enter sold price"
                    />
                    {errors.soldPrice && touched.soldPrice && (
                      <div className="text-red-500 text-sm">
                        {errors.soldPrice}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Field
                      as={Input}
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      placeholder="Enter purchase price"
                    />
                    {errors.purchasePrice && touched.purchasePrice && (
                      <div className="text-red-500 text-sm">
                        {errors.purchasePrice}
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
                    <Label htmlFor="packageSize">Unit</Label>
                    <Select
                      onValueChange={(value) =>
                        setFieldValue("packageSize", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="pk">Pk</SelectItem>
                        <SelectItem value="tube">Tube</SelectItem>
                        <SelectItem value="vial">Vial</SelectItem>
                        <SelectItem value="ampoule">Ampoule</SelectItem>
                        <SelectItem value="glass">Glass</SelectItem>
                        <SelectItem value="plastic">Plastic</SelectItem>
                        <SelectItem value="syrings">Syrings</SelectItem>
                        <SelectItem value="sachet">Sachet</SelectItem>
                        <SelectItem value="aerosol">Aerosol</SelectItem>
                        <SelectItem value="spray">Spray</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="cops">Cops</SelectItem>
                        <SelectItem value="carton">Carton</SelectItem>
                        <SelectItem value="tin">Tin</SelectItem>
                        <SelectItem value="cans">Cans</SelectItem>
                        <SelectItem value="pouches">Pouches</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.packageSize && touched.packageSize && (
                      <div className="text-red-500 text-sm">
                        {errors.packageSize}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cartonSize">Carton Size</Label>
                    <Field
                      as={Input}
                      id="cartonSize"
                      name="cartonSize"
                      placeholder="Enter carton size (e.g., 10x10)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
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
                            {category.categoryName || category.name}
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
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/products")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Product"}
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

export default NewProduct;
