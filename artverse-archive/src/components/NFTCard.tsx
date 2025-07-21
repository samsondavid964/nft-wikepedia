import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";
import { useState } from "react";

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTCardProps {
  id: string;
  name: string;
  image: string;
  description: string;
  attributes: NFTAttribute[];
  collection?: string;
  chain?: string;
  mintDate?: string;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

const NFTCard = ({ 
  id, 
  name, 
  image, 
  description, 
  attributes, 
  collection = "Unknown Collection",
  chain = "Ethereum",
  mintDate = "2024-01-01",
  viewMode = 'grid',
  onClick
}: NFTCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card 
        className="group overflow-hidden bg-card border-border hover:shadow-hover transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]" 
        onClick={onClick}
      >
        <div className="flex gap-4 p-4">
          <div className="relative w-24 h-24 overflow-hidden bg-muted rounded-lg flex-shrink-0">
            <img 
              src={image} 
              alt={name}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop";
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {collection}
                </p>
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                  {name}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {chain}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLiked(!isLiked);
                  }}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "text-accent fill-accent" : ""}`} />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {attributes.slice(0, 3).map((attr, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {attr.value}
                  </Badge>
                ))}
                {attributes.length > 3 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{attributes.length - 3} more
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Minted {new Date(mintDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="group overflow-hidden bg-card border-border hover:shadow-hover transition-all duration-300 hover:scale-[1.02] cursor-pointer active:scale-[0.98]" 
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop";
          }}
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors duration-200"
          >
            <Heart 
              size={16} 
              className={isLiked ? "text-accent fill-accent" : "text-foreground"} 
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle external link
            }}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors duration-200"
          >
            <ExternalLink size={16} className="text-foreground" />
          </button>
        </div>
        
        {/* Chain badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {chain}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {collection}
              </p>
            </div>
            <p className="text-xs text-muted-foreground ml-2">
              #{id}
            </p>
          </div>
          
          {/* Attributes */}
          {attributes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {attributes.slice(0, 3).map((attr, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="text-xs py-0.5 px-2"
                >
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {attributes.length > 3 && (
                <Badge variant="outline" className="text-xs py-0.5 px-2">
                  +{attributes.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Minted: {new Date(mintDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTCard;