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
import { AlertCircle } from "lucide-react";
import * as Yup from "yup";
import { updateCategory } from "./api/categoryAPI";
import type { Category } from "./constants/catgory";

const validationSchema = Yup.object({
  categoryName: Yup.string()
    .min(3, "Category name must be at least 3 characters")
    .max(50, "Category name must be less than 50 characters")
    .required("Category name is required"),
  categoryDescription: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .required("Description is required"),
});

interface UpdateCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

const UpdateCategory: React.FC<UpdateCategoryProps> = ({
  open,
  onOpenChange,
  category,
}) => {
  const handleSubmit = async (
    values: Category,
    { setSubmitting, setStatus }: FormikHelpers<Category>
  ) => {
    try {
      await updateCategory(category.id, values);
      onOpenChange(false);
      setStatus({ success: true });
    } catch (error) {
      console.error("Error updating category:", error);
      setStatus({ error: "Failed to update category. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Category
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Update category details
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={{
            categoryName: category.categoryName,
            categoryDescription: category.categoryDescription,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, status }) => (
            <Form className="space-y-6">
              <div>
                <Label
                  htmlFor="categoryName"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category Name
                </Label>
                <Field
                  as={Input}
                  id="categoryName"
                  name="categoryName"
                  placeholder="Enter category name"
                  className="mt-1 h-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.categoryName && touched.categoryName && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.categoryName}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="categoryDescription"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </Label>
                <Field
                  as={Textarea}
                  id="categoryDescription"
                  name="categoryDescription"
                  placeholder="Enter category description"
                  rows={4}
                  className="mt-1 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {errors.categoryDescription && touched.categoryDescription && (
                  <div className="mt-1 flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.categoryDescription}
                  </div>
                )}
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
                  {isSubmitting ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateCategory;
