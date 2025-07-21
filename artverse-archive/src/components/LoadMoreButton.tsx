import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

const LoadMoreButton = ({ onLoadMore, hasMore = false, loading = false }: LoadMoreButtonProps) => {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center pt-8">
      <Button
        onClick={onLoadMore}
        disabled={loading}
        className="min-w-32"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Load More NFTs'
        )}
      </Button>
    </div>
  );
};

export default LoadMoreButton;