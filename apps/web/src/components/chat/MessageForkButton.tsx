import { memo } from "react";
import { GitForkIcon } from "lucide-react";
import { Button } from "../ui/button";

export const MessageForkButton = memo(function MessageForkButton({
  onFork,
  disabled,
}: {
  onFork: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      disabled={disabled}
      onClick={onFork}
      title="Fork conversation here"
    >
      <GitForkIcon className="size-3" />
    </Button>
  );
});
