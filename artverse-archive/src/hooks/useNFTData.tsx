import { useEffect, useState, useCallback } from "react";

// You will handle the API_BASE_URL yourself.
// For this example, I'll keep it as a placeholder pointing to the correct base.
const API_BASE_URL = "https://nft-wikepedia-api.onrender.com";

interface NFT {
  id: string;
  name: string;
  image: string; // This will hold the final resolved image URL (S3, IPFS, or fallback)
  description: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: string;
  chain?: string;
  mintDate?: string;
  // It's good practice to also type the raw backend fields if you access them directly
  // or if they influence your mapping logic.
  cached_image_url?: string; // Add this if the backend directly sends it at the top level
  raw_metadata?: {
    image?: string;
    image_url?: string;
    name?: string;
    description?: string;
    collection?: { name?: string };
    minted_date?: string;
    // ... any other relevant raw_metadata fields
  };
  contract_address?: string; // Add this if you use it for the ID
  token_id?: string;        // Add this if you use it for the ID
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
    
    const parts = query.match(/(".*?"|\S+)/g) || [];
    
    parts.forEach(part => {
      const cleanPart = part.replace(/^"(.*)"$/, '$1');
      
      if (cleanPart.startsWith('blockchain:')) {
        filters.blockchain = cleanPart.substring(10).toLowerCase();
      } else if (cleanPart.startsWith('chain:')) {
        filters.blockchain = cleanPart.substring(6).toLowerCase();
      } else if (cleanPart.startsWith('type:')) {
        filters.fileType = cleanPart.substring(5).toLowerCase();
      } else if (cleanPart.startsWith('#')) {
        filters.tokenId = cleanPart.substring(1);
      } else if (/^\d+$/.test(cleanPart)) {
        filters.tokenId = cleanPart;
      } else {
        terms.push(cleanPart.toLowerCase());
      }
    });
    
    return { terms, filters };
  }, []);

  const filterNFTs = useCallback((nfts: NFT[], query: string) => {
    if (!query.trim()) return nfts;
    
    const { terms, filters } = parseSearchQuery(query);
    
    return nfts.filter(nft => {
      if (filters.blockchain && nft.chain?.toLowerCase() !== filters.blockchain) {
        return false;
      }
      
      if (filters.fileType) {
        const imageTypes = ['image', 'img', 'jpeg', 'jpg', 'png', 'gif', 'webp'];
        const videoTypes = ['video', 'mp4', 'avi', 'mov', 'webm'];
        
        // Use nft.image for filtering, as it's the resolved URL
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
      
      if (filters.tokenId && !nft.id.includes(filters.tokenId) && 
          !nft.name.toLowerCase().includes(`#${filters.tokenId}`)) {
        return false;
      }
      
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
      // Ensure API_BASE_URL is correct (e.g., "https://api.example.com", not "https://api.example.com/nfts")
      const response = await fetch(`${API_BASE_URL}/nfts`); 
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const backendNFTs = await response.json();

      const mappedNFTs: NFT[] = backendNFTs.map((nft: any) => {
        let imageUrl = nft.cached_image_url; // 1. Try cached_image_url first (S3)

        // 2. Fallback to raw_metadata image if cached_image_url is null/undefined/empty
        if (!imageUrl && nft.raw_metadata) {
            imageUrl = nft.raw_metadata.image || nft.raw_metadata.image_url || "";
        }

        // 3. Final fallback if no image URL is found
        if (!imageUrl) {
            imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop"; // fallback stock image
        }

        // --- Console logs for debugging ---
        console.group("NFT Debug Info for:", nft.name || nft.token_id || nft.id);
        console.log("Raw backend NFT object:", nft);
        console.log("cached_image_url (from backend):", nft.cached_image_url);
        console.log("raw_metadata.image (from backend):", nft.raw_metadata?.image);
        console.log("raw_metadata.image_url (from backend):", nft.raw_metadata?.image_url);
        console.log("--- FINAL imageUrl resolved to:", imageUrl);
        console.groupEnd();
        // --- End Console logs ---


        let attributes: Array<{ trait_type: string; value: string }> = [];
        if (Array.isArray(nft.attributes)) {
          attributes = nft.attributes;
        } else if (nft.attributes && typeof nft.attributes === "object") {
          attributes = Object.entries(nft.attributes).map(([trait_type, value]) => ({ trait_type, value: String(value) }));
        }

        return {
          id: `${nft.contract_address}:${nft.token_id}`,
          name: nft.name || nft.raw_metadata?.name || "Unnamed NFT",
          image: imageUrl, // <--- This `image` property will be passed to NFTCard
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
      console.error("Failed to fetch NFTs:", e);
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
