import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import NFTGrid from "@/components/NFTGrid";
import NFTDetailModal from "@/components/NFTDetailModal";
import { Database, Sparkles, TrendingUp } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedNFT(null);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Artverse Archive</h1>
                <p className="text-xs text-muted-foreground">NFT Discovery Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>12.5M+ NFTs indexed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Live updates</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Discover Digital Art
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              The most comprehensive archive of NFTs across all major blockchains. 
              Search, filter, and explore millions of digital artworks.
            </p>
            
            <SearchBar
              onSearch={handleSearch}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center p-6 bg-card rounded-lg shadow-card">
              <div className="text-2xl font-bold text-primary mb-2">12.5M+</div>
              <div className="text-sm text-muted-foreground">NFTs Indexed</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg shadow-card">
              <div className="text-2xl font-bold text-primary mb-2">6</div>
              <div className="text-sm text-muted-foreground">Blockchains</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg shadow-card">
              <div className="text-2xl font-bold text-primary mb-2">1M+</div>
              <div className="text-sm text-muted-foreground">Collections</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <NFTGrid
            searchQuery={searchQuery}
            onNFTClick={handleNFTClick}
          />
        </div>
      </section>

      <NFTDetailModal 
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        nft={selectedNFT}
      />

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Artverse Archive</h3>
                  <p className="text-sm text-muted-foreground">NFT Discovery Platform</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                The most comprehensive open-source archive of NFTs across all major blockchains. 
                Discover, explore, and research digital art with powerful search and filtering tools.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Artverse Archive. Open source NFT indexing platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
