import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from './useSocket';
import { SearchSuggestion } from '@/lib/socket';

export const useSearch = () => {
  const socket = useSocket();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for search suggestions
    socket.on('search:suggestions', (data: SearchSuggestion) => {
      if (data.query === query) {
        setSuggestions(data.suggestions);
        setIsSearching(false);
      }
    });

    // Load recent searches from localStorage
    const saved = localStorage.getItem('lexchronos-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }

    return () => {
      socket.off('search:suggestions');
    };
  }, [socket, query]);

  const performSearch = useCallback((searchQuery: string, type: 'general' | 'cases' | 'documents' | 'people' = 'general') => {
    if (socket && searchQuery.trim()) {
      setIsSearching(true);
      setQuery(searchQuery);
      
      socket.emit('search:query', {
        query: searchQuery.trim(),
        type
      });

      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())];
        const trimmed = updated.slice(0, 10); // Keep last 10 searches
        localStorage.setItem('lexchronos-recent-searches', JSON.stringify(trimmed));
        return trimmed;
      });
    }
  }, [socket]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('lexchronos-recent-searches');
  }, []);

  const removeRecentSearch = useCallback((searchToRemove: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== searchToRemove);
      localStorage.setItem('lexchronos-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Debounced search for real-time suggestions
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchQuery: string, type: 'general' | 'cases' | 'documents' | 'people' = 'general') => {
      clearTimeout(timeoutId);
      
      if (searchQuery.length >= 2) {
        timeoutId = setTimeout(() => {
          performSearch(searchQuery, type);
        }, 300); // 300ms debounce
      } else {
        setSuggestions([]);
        setIsSearching(false);
      }
    };
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsSearching(false);
  }, []);

  return {
    query,
    suggestions,
    isSearching,
    recentSearches,
    performSearch,
    debouncedSearch,
    clearSearch,
    clearRecentSearches,
    removeRecentSearch
  };
};