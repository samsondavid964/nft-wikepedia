import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ExternalLink, Share2, Calendar, Hash, Layers } from "lucide-react";
import { useState } from "react";

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: {
    id: string;
    name: string;
    image: string;
    description: string;
    attributes: NFTAttribute[];
    collection?: string;
    chain?: string;
    mintDate?: string;
  } | null;
}

const NFTDetailModal = ({ isOpen, onClose, nft }: NFTDetailModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!nft) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-card border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Image Section */}
          <div className="relative bg-muted flex items-center justify-center p-6">
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden bg-background/5 backdrop-blur-sm">
              <img 
                src={nft.image} 
                alt={nft.name}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop";
                }}
              />
              
              {/* Floating Action Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-10 h-10 p-0 bg-white/90 hover:bg-white"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "text-accent fill-accent" : ""}`} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-10 h-10 p-0 bg-white/90 hover:bg-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-10 h-10 p-0 bg-white/90 hover:bg-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Chain Badge */}
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="font-medium">
                  {nft.chain}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                    {nft.name}
                  </DialogTitle>
                  <DialogDescription className="text-lg text-muted-foreground">
                    {nft.collection}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  {nft.id}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 px-6 pb-6 overflow-y-auto space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {nft.description}
                </p>
              </div>

              <Separator />

              {/* Metadata */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Mint Date</p>
                      <p className="font-medium text-foreground">
                        {new Date(nft.mintDate || '').toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Blockchain</p>
                      <p className="font-medium text-foreground">{nft.chain}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Attributes */}
              {nft.attributes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4">
                    Attributes ({nft.attributes.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {nft.attributes.map((attr, index) => (
                      <Card key={index} className="hover:shadow-hover transition-shadow duration-200">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">
                            {attr.trait_type}
                          </p>
                          <p className="font-medium text-foreground">
                            {attr.value}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFTDetailModal;