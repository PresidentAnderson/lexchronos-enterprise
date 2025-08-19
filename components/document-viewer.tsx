"use client";

import * as React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Download,
  Share,
  MoreVertical,
  Search,
  Filter,
  Grid3X3,
  List,
  Upload,
  Eye,
  Edit,
  Trash,
  Star,
  Calendar,
  User,
  Tag,
  Folder,
} from "lucide-react";

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "doc" | "docx" | "txt" | "image" | "spreadsheet";
  size: number;
  uploadDate: string;
  lastModified: string;
  category: "pleading" | "evidence" | "correspondence" | "contract" | "research" | "other";
  tags: string[];
  caseId?: string;
  caseName?: string;
  uploadedBy: string;
  version: number;
  isStarred: boolean;
  url: string;
  thumbnail?: string;
  description?: string;
}

interface DocumentViewerProps {
  documents: Document[];
  view?: "grid" | "list";
  onDocumentClick?: (document: Document) => void;
  onDocumentUpload?: (files: FileList) => void;
  className?: string;
  showUpload?: boolean;
}

const documentIcons = {
  pdf: "🔴",
  doc: "🔵",
  docx: "🔵",
  txt: "📄",
  image: "🖼️",
  spreadsheet: "🟢",
};

const categoryColors = {
  pleading: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  evidence: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  correspondence: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  contract: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  research: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

export function DocumentViewer({
  documents,
  view = "grid",
  onDocumentClick,
  onDocumentUpload,
  className,
  showUpload = true,
}: DocumentViewerProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [currentView, setCurrentView] = React.useState(view);
  const [sortBy, setSortBy] = React.useState<"name" | "date" | "size">("name");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = searchTerm === "" || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case "size":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchTerm, selectedCategory, sortBy]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onDocumentUpload) {
      onDocumentUpload(files);
    }
  };

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all group"
      onClick={() => onDocumentClick?.(document)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{documentIcons[document.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" title={document.name}>
                {document.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", categoryColors[document.category])}
                >
                  {document.category}
                </Badge>
                {document.isStarred && (
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                {document.isStarred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {document.thumbnail && (
          <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
            <img 
              src={document.thumbnail} 
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(document.uploadDate), "MMM d, yyyy")}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{document.uploadedBy}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>{formatFileSize(document.size)}</span>
            <span>v{document.version}</span>
          </div>
        </div>

        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const DocumentListItem = ({ document }: { document: Document }) => (
    <Card 
      className="cursor-pointer hover:shadow-sm transition-all"
      onClick={() => onDocumentClick?.(document)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-xl">{documentIcons[document.type]}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{document.name}</p>
              {document.isStarred && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", categoryColors[document.category])}
              >
                {document.category}
              </Badge>
              <span>{document.uploadedBy}</span>
              <span>{format(new Date(document.uploadDate), "MMM d, yyyy")}</span>
              <span>{formatFileSize(document.size)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {document.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory("pleading")}>
                Pleadings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory("evidence")}>
                Evidence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory("correspondence")}>
                Correspondence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory("contract")}>
                Contracts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory("research")}>
                Research
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("size")}>
                Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-md">
            <Button 
              variant={currentView === "grid" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setCurrentView("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={currentView === "list" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setCurrentView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {showUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Document grid/list */}
      {currentView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((document) => (
            <DocumentListItem key={document.id} document={document} />
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}