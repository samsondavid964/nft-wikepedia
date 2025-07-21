import { useState } from "react";
import { Loader2 } from "lucide-react";
import NFTGridHeader from "./NFTGridHeader";
import NFTGridContent from "./NFTGridContent";
import LoadMoreButton from "./LoadMoreButton";
import { useNFTData } from "@/hooks/useNFTData";

interface NFTGridProps {
  searchQuery?: string;
  onNFTClick?: (nft: any) => void;
}

const NFTGrid = ({ 
  searchQuery = "", 
  onNFTClick
}: NFTGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { nfts, loading, hasMore, loadMore, totalCount } = useNFTData(searchQuery);

  if (loading && nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Discovering NFTs...</p>
      </div>
    );
  }

  if (nfts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No NFTs found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NFTGridHeader 
        totalCount={totalCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <NFTGridContent 
        nfts={nfts}
        viewMode={viewMode}
        onNFTClick={onNFTClick || (() => {})}
      />

      <LoadMoreButton
        onLoadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
      />
    </div>
  );
};

export default NFTGrid;