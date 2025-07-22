import { useEffect, useState, useCallback } from "react";

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

export const useNFTData = (searchQuery: string) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const pageSize = 12;

  const parseSearchQuery = useCallback((query: string) => {
    const terms: string[] = [];
    const filters: any = {};
    
    // Split query by spaces but keep quoted strings together
    const parts = query.match(/(".*?"|\S+)/g) || [];
    
    parts.forEach(part => {
      const cleanPart = part.replace(/^"(.*)"$/, '$1'); // Remove quotes
      
      // Check for specific search patterns
      if (cleanPart.startsWith('blockchain:')) {
        filters.blockchain = cleanPart.substring(10).toLowerCase();
      } else if (cleanPart.startsWith('chain:')) {
        filters.blockchain = cleanPart.substring(6).toLowerCase();
      } else if (cleanPart.startsWith('type:')) {
        filters.fileType = cleanPart.substring(5).toLowerCase();
      } else if (cleanPart.startsWith('#')) {
        // Token ID search
        filters.tokenId = cleanPart.substring(1);
      } else if (/^\d+$/.test(cleanPart)) {
        // Pure number - also treat as potential token ID
        filters.tokenId = cleanPart;
      } else {
        // Regular search term
        terms.push(cleanPart.toLowerCase());
      }
    });
    
    return { terms, filters };
  }, []);

  const filterNFTs = useCallback((nfts: NFT[], query: string) => {
    if (!query.trim()) return nfts;
    
    const { terms, filters } = parseSearchQuery(query);
    
    return nfts.filter(nft => {
      // Blockchain filter
      if (filters.blockchain && nft.chain?.toLowerCase() !== filters.blockchain) {
        return false;
      }
      
      // File type filter (mock - would check actual file extension in real app)
      if (filters.fileType) {
        const imageTypes = ['image', 'img', 'jpeg', 'jpg', 'png', 'gif', 'webp'];
        const videoTypes = ['video', 'mp4', 'avi', 'mov', 'webm'];
        
        if (filters.fileType === 'image' && !imageTypes.some(type => 
          nft.image?.toLowerCase().includes(type) || nft.name.toLowerCase().includes(type)
        )) {
          return false;
        }
        
        if (filters.fileType === 'video' && !videoTypes.some(type => 
          nft.image?.toLowerCase().includes(type) || nft.name.toLowerCase().includes(type)
        )) {
          return false;
        }
      }
      
      // Token ID filter
      if (filters.tokenId && !nft.id.includes(filters.tokenId) && 
          !nft.name.toLowerCase().includes(`#${filters.tokenId}`)) {
        return false;
      }
      
      // General search terms
      if (terms.length > 0) {
        const searchableText = [
          nft.name,
          nft.collection || '',
          nft.description,
          nft.chain || '',
          ...nft.attributes.map(attr => `${attr.trait_type} ${attr.value}`)
        ].join(' ').toLowerCase();
        
        const matchesAllTerms = terms.every(term => searchableText.includes(term));
        if (!matchesAllTerms) return false;
      }
      
      return true;
    });
  }, [parseSearchQuery]);

  const loadNFTs = useCallback(async (reset: boolean = false) => {
    setLoading(true);
    try {
      // Fetch from backend
      const response = await fetch("https://nft-wikepedia-api.onrender.com/nfts");
      const backendNFTs = await response.json();
      // Map backend NFT to frontend NFT interface
      const mappedNFTs: NFT[] = backendNFTs.map((nft: any) => {
        // Try to extract image from raw_metadata
        let image = "";
        if (nft.raw_metadata) {
          image = nft.raw_metadata.image || nft.raw_metadata.image_url || "";
        }
        if (!image) {
          image = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop"; // fallback
        }
        // Attributes: ensure array of {trait_type, value}
        let attributes: Array<{ trait_type: string; value: string }> = [];
        if (Array.isArray(nft.attributes)) {
          attributes = nft.attributes;
        } else if (nft.attributes && typeof nft.attributes === "object") {
          // Some NFTs store attributes as an object
          attributes = Object.entries(nft.attributes).map(([trait_type, value]) => ({ trait_type, value: String(value) }));
        }
        return {
          id: `${nft.contract_address}:${nft.token_id}`,
          name: nft.name || nft.raw_metadata?.name || "Unnamed NFT",
          image,
          description: nft.description || nft.raw_metadata?.description || "",
          attributes,
          collection: nft.raw_metadata?.collection?.name || "",
          chain: nft.chain || "",
          mintDate: nft.raw_metadata?.minted_date || ""
        };
      });
      const filtered = filterNFTs(mappedNFTs, searchQuery);
      const startIndex = reset ? 0 : (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const newNFTs = filtered.slice(startIndex, endIndex);
      if (reset) {
        setNfts(newNFTs);
        setPage(2);
      } else {
        setNfts(prev => [...prev, ...newNFTs]);
        setPage(prev => prev + 1);
      }
      setHasMore(endIndex < filtered.length);
    } catch (e) {
      setNfts([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [searchQuery, page, filterNFTs]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadNFTs(false);
    }
  }, [loading, hasMore, loadNFTs]);

  useEffect(() => {
    setPage(1);
    loadNFTs(true);
  }, [searchQuery]);

  return {
    nfts,
    loading,
    hasMore,
    loadMore,
    totalCount: nfts.length
  };
};
