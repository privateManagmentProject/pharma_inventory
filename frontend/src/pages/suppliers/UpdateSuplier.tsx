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
import { updateSupplier } from "./api/supplierAPI";
import type { Account, Supplier } from "./constants/supplier";

const validationSchema = Yup.object({
  name: Yup.string().required("Supplier name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  description: Yup.string(),
  tinNumber: Yup.string().required("TIN number is required"),
});

interface UpdateSupplierProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
}

const UpdateSupplier: React.FC<UpdateSupplierProps> = ({
  open,
  onOpenChange,
  supplier,
}) => {
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(
    supplier.accounts && supplier.accounts.length > 0
      ? supplier.accounts
      : [{ name: "", number: "", isDefault: true }]
  );

  const handleAddAccount = () => {
    setAccounts([...accounts, { name: "", number: "", isDefault: false }]);
  };

  const handleRemoveAccount = (index: number) => {
    if (accounts.length <= 1) return;

    const newAccounts = [...accounts];
    newAccounts.splice(index, 1);

    // If we removed the default account, set the first one as default
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

    // If setting this account as default, unset all others
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
    }: FormikHelpers<Omit<Supplier, "licenses" | "accounts" | "id">>
  ) => {
    try {
      const formData = new FormData();

      // Append all form fields
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("description", values.description || "");
      formData.append("tinNumber", values.tinNumber);
      formData.append("accounts", JSON.stringify(accounts));

      // Append license files
      licenseFiles.forEach((file) => {
        formData.append("licenses", file);
      });

      await updateSupplier(supplier.id!, formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating supplier:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            description: supplier.description || "",
            tinNumber: supplier.tinNumber,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched }) => (
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
                <Label htmlFor="description">Description</Label>
                <Field
                  as={Textarea}
                  id="description"
                  name="description"
                  placeholder="Enter supplier description"
                  rows={2}
                />
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
                <Label htmlFor="licenses">
                  Add More License Files (PDF/Images)
                </Label>
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
                    <p className="text-sm">New files to upload:</p>
                    {licenseFiles.map((file, index) => (
                      <p key={index} className="text-sm text-gray-500">
                        {file.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Bank Accounts</Label>
                  <Button type="button" onClick={handleAddAccount} size="sm">
                    Add Account
                  </Button>
                </div>

                {accounts.map((account, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 p-2 border rounded"
                  >
                    <div className="md:col-span-5">
                      <Input
                        placeholder="Account Name"
                        value={account.name}
                        onChange={(e) =>
                          handleAccountChange(index, "name", e.target.value)
                        }
                        required
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
                      />
                    </div>
                    <div className="md:col-span-1 flex items-center">
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
                        className="mr-1"
                      />
                      <Label className="text-sm">Default</Label>
                    </div>
                    <div className="md:col-span-1">
                      {accounts.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveAccount(index)}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
                  {isSubmitting ? "Updating..." : "Update Supplier"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSupplier;
