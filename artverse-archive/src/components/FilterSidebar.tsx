import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Calendar, Layers, Image, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: any) => void;
}

const FilterSidebar = ({ isOpen, onClose, onFiltersChange }: FilterSidebarProps) => {
  const chains = ["Ethereum", "Polygon", "Solana", "Tezos", "Arbitrum", "Optimism"];
  const mediaTypes = ["Image", "Video", "Audio", "3D Model", "Interactive"];
  const collections = ["CryptoPunks", "Bored Ape Yacht Club", "Art Blocks", "Azuki", "Doodles"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border overflow-y-auto lg:relative lg:w-full lg:h-auto lg:border-l-0 lg:border lg:rounded-lg animate-slide-up">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Filters</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Chain Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Blockchain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {chains.map((chain) => (
                <div key={chain} className="flex items-center space-x-2">
                  <Checkbox id={chain} />
                  <Label htmlFor={chain} className="text-sm font-normal">
                    {chain}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Media Type Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Image className="h-4 w-4" />
                Media Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mediaTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox id={type} />
                  <Label htmlFor={type} className="text-sm font-normal">
                    {type}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Collections Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {collections.map((collection) => (
                <div key={collection} className="flex items-center space-x-2">
                  <Checkbox id={collection} />
                  <Label htmlFor={collection} className="text-sm font-normal">
                    {collection}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Date Range Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mint Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {/* Active Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Active Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  Ethereum
                  <X className="h-3 w-3 ml-1 cursor-pointer" />
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Images
                  <X className="h-3 w-3 ml-1 cursor-pointer" />
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Clear all filters
                onFiltersChange({});
              }}
            >
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // Apply filters
                onFiltersChange({});
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;