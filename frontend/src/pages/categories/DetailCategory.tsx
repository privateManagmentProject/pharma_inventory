import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define the type for the category prop
interface Category {
  categoryName: string;
  categoryDescription: string;
}

// Define the props for the DetailCategory component
interface DetailCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

const DetailCategory: React.FC<DetailCategoryProps> = ({
  open,
  onOpenChange,
  category,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Category Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Category Name</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {category.categoryName}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Description</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {category.categoryDescription}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default DetailCategory;
