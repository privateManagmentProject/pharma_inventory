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
import * as Yup from "yup";
import { addCategory } from "./api/categoryAPI";
import type { Category } from "./constants/catgory";

const validationSchema = Yup.object({
  categoryName: Yup.string().required("Category name is required"),
  categoryDescription: Yup.string().required("Description is required"),
});
interface NewCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const NewCategory: React.FC<NewCategoryProps> = ({ open, onOpenChange }) => {
  const handleSubmit = async (
    values: Category,
    { setSubmitting, resetForm }: FormikHelpers<Category>
  ) => {
    try {
      await addCategory(values);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            categoryName: "",
            categoryDescription: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Field
                  as={Input}
                  id="categoryName"
                  name="categoryName"
                  placeholder="Enter category name"
                />
                {errors.categoryName && touched.categoryName && (
                  <div className="text-red-500 text-sm">
                    {errors.categoryName}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Field
                  as={Textarea}
                  id="categoryDescription"
                  name="categoryDescription"
                  placeholder="Enter category description"
                  rows={3}
                />
                {errors.categoryDescription && touched.categoryDescription && (
                  <div className="text-red-500 text-sm">
                    {errors.categoryDescription}
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
                  {isSubmitting ? "Adding..." : "Add Category"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default NewCategory;
