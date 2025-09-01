import React, { type HTMLProps } from "react";
export const IndeterminateCheckbox = ({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) => {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <div className="checkbox">
      <input
        type="checkbox"
        ref={ref}
        className={className + "cursor-pointer"}
        aria-checked={"mixed"}
        {...rest}
      />
    </div>
  );
};
