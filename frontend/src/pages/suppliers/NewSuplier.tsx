import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, Form, Formik, type FormikHelpers } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { addSupplier } from "./api/supplierAPI";
import type { Supplier } from "./constants/supplier";

const validationSchema = Yup.object({
  name: Yup.string().required("Customer name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  tinNumber: Yup.string().required("TIN number is required"),
  account: Yup.object({
    name: Yup.string().required("Account name is required"),
    number: Yup.string().required("Account number is required"),
  }).required("Account information is required"),
});

interface NewSuplierProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSuplier: React.FC<NewSuplierProps> = ({ open, onOpenChange }) => {
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);

  const handleSubmit = async (
    values: Omit<Supplier, "licenses">,
    { setSubmitting, resetForm }: FormikHelpers<Omit<Supplier, "licenses">>
  ) => {
    try {
      const formData = new FormData();

      // Append all form fields
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("tinNumber", values.tinNumber);
      formData.append("accountName", values.account.name);
      formData.append("accountNumber", values.account.number);

      // Append license files
      licenseFiles.forEach((file) => {
        formData.append("licenses", file);
      });

      await addSupplier(formData);
      resetForm();
      setLicenseFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            address: "",
            tinNumber: "",
            account: {
              name: "",
              number: "",
            },
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter supplier name"
                />
                {errors.name && touched.name && (
                  <div className="text-red-500 text-sm">{errors.name}</div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Field
                  as={Input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-sm">{errors.email}</div>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Field
                  as={Input}
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                />
                {errors.phone && touched.phone && (
                  <div className="text-red-500 text-sm">{errors.phone}</div>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Field
                  as={Textarea}
                  id="address"
                  name="address"
                  placeholder="Enter full address"
                  rows={3}
                />
                {errors.address && touched.address && (
                  <div className="text-red-500 text-sm">{errors.address}</div>
                )}
              </div>

              <div>
                <Label htmlFor="tinNumber">TIN Number</Label>
                <Field
                  as={Input}
                  id="tinNumber"
                  name="tinNumber"
                  placeholder="Enter TIN number"
                />
                {errors.tinNumber && touched.tinNumber && (
                  <div className="text-red-500 text-sm">{errors.tinNumber}</div>
                )}
              </div>

              <div>
                <Label htmlFor="licenses">License Files (PDF/Images)</Label>
                <Input
                  id="licenses"
                  name="licenses"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files) {
                      setLicenseFiles(Array.from(e.target.files));
                    }
                  }}
                />
                {licenseFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">Selected files:</p>
                    {licenseFiles.map((file, index) => (
                      <p key={index} className="text-sm text-gray-500">
                        {file.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Field
                  as={Input}
                  id="accountName"
                  name="account.name"
                  placeholder="Enter account name"
                />
                {errors.account?.name && touched.account?.name && (
                  <div className="text-red-500 text-sm">
                    {errors.account.name}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Field
                  as={Input}
                  id="accountNumber"
                  name="account.number"
                  placeholder="Enter account number"
                />
                {errors.account?.number && touched.account?.number && (
                  <div className="text-red-500 text-sm">
                    {errors.account.number}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Supplier"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default NewSuplier;
