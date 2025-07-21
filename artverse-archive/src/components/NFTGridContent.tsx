import NFTCard from "./NFTCard";

interface NFT {
  id: string;
  name: string;
  image: string;
  description: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: string;
  chain?: string;
  mintDate?: string;
}

interface NFTGridContentProps {
  nfts: NFT[];
  viewMode: 'grid' | 'list';
  onNFTClick: (nft: NFT) => void;
}

const NFTGridContent = ({ nfts, viewMode, onNFTClick }: NFTGridContentProps) => {
  return (
    <div className={`grid gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
        : 'grid-cols-1'
    }`}>
      {nfts.map((nft, index) => (
        <div 
          key={nft.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <NFTCard {...nft} viewMode={viewMode} onClick={() => onNFTClick(nft)} />
        </div>
      ))}
    </div>
  );
};

export default NFTGridContent;