import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, Form, Formik, type FormikHelpers } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { addCustomer } from "./api/customerAPI";
import type { Customer } from "./constants/customer";

const validationSchema = Yup.object({
  name: Yup.string().required("Customer name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  companyName: Yup.string().required("companyName is required"),
  tinNumber: Yup.string().required("TIN number is required"),
  receiverInfo: Yup.object({
    name: Yup.string().required("Account name is required"),
    phone: Yup.string().required("Phone number is required"),
    address: Yup.string().required("Address is required"),
  }).required("Account information is required"),
});

interface NewCustomerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewCustomer: React.FC<NewCustomerProps> = ({ open, onOpenChange }) => {
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);

  const handleSubmit = async (
    values: Omit<Customer, "licenses">,
    { setSubmitting, resetForm }: FormikHelpers<Omit<Customer, "licenses">>
  ) => {
    try {
      const formData = new FormData();

      // Append all form fields
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("tinNumber", values.tinNumber);
      formData.append("receiverName", values.receiverInfo.name);
      formData.append("receiverPhone", values.receiverInfo.phone);
      formData.append("receiverAddress", values.receiverInfo.address);
      formData.append("companyName", values.companyName);
      formData.append("withhold", String(values.withhold));

      // Append license files
      licenseFiles.forEach((file) => {
        formData.append("licenses", file);
      });

      await addCustomer(formData);
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
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            name: "",
            email: "",
            withhold: false,
            companyName: "",
            phone: "",
            address: "",
            tinNumber: "",
            receiverInfo: {
              name: "",
              phone: "",
              address: "",
            },
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name</Label>
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
                <Label htmlFor="address">Company Name</Label>
                <Field
                  as={Input}
                  id="companyName"
                  name="companyName"
                  placeholder="Enter Company Name"
                  rows={3}
                />
                {errors.companyName && touched.companyName && (
                  <div className="text-red-500 text-sm">
                    {errors.companyName}
                  </div>
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
                <Label htmlFor="receiverName">Receiver Name</Label>
                <Field
                  as={Input}
                  id="receiverName"
                  name="receiverInfo.name"
                  placeholder="Enter receiverInfo name"
                />
                {errors.receiverInfo?.name && touched.receiverInfo?.name && (
                  <div className="text-red-500 text-sm">
                    {errors.receiverInfo.name}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="receiverPhone">Receiver Number</Label>
                <Field
                  as={Input}
                  id="receiverPhone"
                  name="receiverInfo.phone"
                  placeholder="Enter receiverInfo number"
                />
                {errors.receiverInfo?.phone && touched.receiverInfo?.phone && (
                  <div className="text-red-500 text-sm">
                    {errors.receiverInfo.phone}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="receiverAddress">Receiver Address</Label>
                <Field
                  as={Input}
                  id="receiverAddress"
                  name="receiverInfo.address"
                  placeholder="Enter receiverInfo address"
                />
                {errors.receiverInfo?.address &&
                  touched.receiverInfo?.address && (
                    <div className="text-red-500 text-sm">
                      {errors.receiverInfo.address}
                    </div>
                  )}
              </div>
              <div>
                <Label htmlFor="withhold">Withhold</Label>
                <Switch id="withhold" name="withhold" />
                {errors.withhold && touched.withhold && (
                  <div className="text-red-500 text-sm">{errors.withhold}</div>
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
                  {isSubmitting ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default NewCustomer;
