import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface NFTGridHeaderProps {
  totalCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const NFTGridHeader = ({ totalCount, viewMode, onViewModeChange }: NFTGridHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">
          {totalCount.toLocaleString()} NFT{totalCount !== 1 ? 's' : ''} found
        </h2>
        <p className="text-muted-foreground mt-1">
          Sorted by date minted (newest first)
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NFTGridHeader;