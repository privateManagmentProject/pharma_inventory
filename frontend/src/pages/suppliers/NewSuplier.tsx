import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, Form, Formik, type FormikHelpers } from "formik";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import * as Yup from "yup";
import { addSupplier } from "./api/supplierAPI";
import type { Account, Supplier } from "./constants/supplier";

const validationSchema = Yup.object({
  name: Yup.string()
    .min(3, "Supplier name must be at least 3 characters")
    .max(100, "Supplier name must be less than 100 characters")
    .required("Supplier name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^\+?[\d\s-]{10,}$/, "Invalid phone number")
    .required("Phone number is required"),
  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .required("Address is required"),
  description: Yup.string().max(
    500,
    "Description must be less than 500 characters"
  ),
  tinNumber: Yup.string()
    .matches(/^\d{9}$/, "TIN number must be 9 digits")
    .required("TIN number is required"),
});

interface NewSupplierProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSupplier: React.FC<NewSupplierProps> = ({ open, onOpenChange }) => {
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([
    { name: "", number: "", isDefault: true },
  ]);

  const handleAddAccount = () => {
    setAccounts([...accounts, { name: "", number: "", isDefault: false }]);
  };

  const handleRemoveAccount = (index: number) => {
    if (accounts.length <= 1) return;

    const newAccounts = [...accounts];
    newAccounts.splice(index, 1);

    if (accounts[index].isDefault && newAccounts.length > 0) {
      newAccounts[0].isDefault = true;
    }

    setAccounts(newAccounts);
  };

  const handleAccountChange = (
    index: number,
    field: keyof Account,
    value: string | boolean
  ) => {
    const newAccounts = [...accounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };

    if (field === "isDefault" && value === true) {
      newAccounts.forEach((acc, i) => {
        if (i !== index) acc.isDefault = false;
      });
    }

    setAccounts(newAccounts);
  };

  const handleSubmit = async (
    values: Omit<Supplier, "licenses" | "accounts" | "id">,
    {
      setSubmitting,
      resetForm,
      setStatus,
    }: FormikHelpers<Omit<Supplier, "licenses" | "accounts" | "id">>
  ) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("description", values.description || "");
      formData.append("tinNumber", values.tinNumber);
      formData.append("accounts", JSON.stringify(accounts));
      licenseFiles.forEach((file) => {
        formData.append("licenses", file);
      });

      await addSupplier(formData);
      resetForm();
      setLicenseFiles([]);
      setAccounts([{ name: "", number: "", isDefault: true }]);
      onOpenChange(false);
      setStatus({ success: true });
    } catch (error) {
      console.error("Error adding supplier:", error);
      setStatus({ error: "Failed to add supplier. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Add New Supplier
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Create a new supplier profile
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            address: "",
            description: "",
            tinNumber: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, status }) => (
            <Form className="space-y-6">
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Supplier Name
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter supplier name"
                  className="mt-1 h-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.name && touched.name && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <Field
                  as={Input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  className="mt-1 h-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.email && touched.email && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone
                </Label>
                <Field
                  as={Input}
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  className="mt-1 h-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.phone && touched.phone && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="address"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address
                </Label>
                <Field
                  as={Textarea}
                  id="address"
                  name="address"
                  placeholder="Enter full address"
                  rows={4}
                  className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.address && touched.address && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.address}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </Label>
                <Field
                  as={Textarea}
                  id="description"
                  name="description"
                  placeholder="Enter supplier description (optional)"
                  rows={3}
                  className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.description && touched.description && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.description}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="tinNumber"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  TIN Number
                </Label>
                <Field
                  as={Input}
                  id="tinNumber"
                  name="tinNumber"
                  placeholder="Enter 9-digit TIN number"
                  className="mt-1 h-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.tinNumber && touched.tinNumber && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.tinNumber}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="licenses"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  License Files (PDF/Images)
                </Label>
                <Input
                  id="licenses"
                  name="licenses"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="mt-1"
                  onChange={(e) => {
                    if (e.target.files) {
                      setLicenseFiles(Array.from(e.target.files));
                    }
                  }}
                />
                {licenseFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Selected files:
                    </p>
                    <ul className="mt-1 space-y-1">
                      {licenseFiles.map((file, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Accounts
                  </Label>
                  <Button
                    type="button"
                    onClick={handleAddAccount}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </div>

                {accounts.map((account, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="md:col-span-5">
                      <Input
                        placeholder="Account Name"
                        value={account.name}
                        onChange={(e) =>
                          handleAccountChange(index, "name", e.target.value)
                        }
                        required
                        className="h-10 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Input
                        placeholder="Account Number"
                        value={account.number}
                        onChange={(e) =>
                          handleAccountChange(index, "number", e.target.value)
                        }
                        required
                        className="h-10 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={account.isDefault}
                          onChange={(e) =>
                            handleAccountChange(
                              index,
                              "isDefault",
                              e.target.checked
                            )
                          }
                          className="mr-2 h-4 w-4"
                        />
                        <Label className="text-sm">Default</Label>
                      </div>
                      {accounts.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveAccount(index)}
                          variant="destructive"
                          size="sm"
                          className="px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {status?.error && (
                <div className="text-red-500 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {status.error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors"
                >
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

export default NewSupplier;
