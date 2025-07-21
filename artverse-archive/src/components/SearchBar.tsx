import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search by Collection, Token ID, Blockchain, File Type, or Artist Wallet..." 
}: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 z-10">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-16 py-6 text-lg border-2 border-border focus:border-primary transition-colors duration-200 bg-card shadow-card"
          />
          
          <div className="absolute right-2 flex items-center">
            <Button
              type="submit"
              size="sm"
              className="h-8 px-4 bg-primary hover:bg-primary/90"
            >
              Search
            </Button>
          </div>
        </div>
      </form>
      
      {/* Search examples and tips */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Quick searches:</span>
          {["CryptoPunks", "Bored Ape", "Art Blocks", "Azuki", "Doodles"].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => {
                setSearchQuery(suggestion);
                onSearch(suggestion);
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Search examples:</span>
          {[
            "blockchain:ethereum", 
            "type:image", 
            "type:video",
            "#1234"
          ].map((example) => (
            <Button
              key={example}
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs font-mono"
              onClick={() => {
                setSearchQuery(example);
                onSearch(example);
              }}
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;