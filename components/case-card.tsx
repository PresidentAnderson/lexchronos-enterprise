"use client";

import * as React from "react";
import { format, differenceInDays } from "date-fns";
import { cn, getStatusColor, getPriorityColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Scale,
  Calendar,
  User,
  FileText,
  Clock,
  MoreVertical,
  AlertTriangle,
  DollarSign,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export interface Case {
  id: string;
  title: string;
  caseNumber: string;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  description: string;
  status: "active" | "pending" | "completed" | "on-hold" | "archived";
  priority: "high" | "medium" | "low";
  practice_area: string;
  assignedLawyer: string;
  createdDate: string;
  lastUpdated: string;
  nextDeadline?: {
    date: string;
    title: string;
    type: string;
  };
  billingInfo?: {
    hourlyRate: number;
    totalBilled: number;
    hoursWorked: number;
  };
  documents: number;
  courtLocation?: string;
  judge?: string;
  opposingCounsel?: string;
  settlement?: {
    amount: number;
    status: "proposed" | "accepted" | "rejected";
  };
}

interface CaseCardProps {
  case: Case;
  onCaseClick?: (caseItem: Case) => void;
  onEditCase?: (caseItem: Case) => void;
  onArchiveCase?: (caseItem: Case) => void;
  onDeleteCase?: (caseItem: Case) => void;
  compact?: boolean;
  className?: string;
}

export function CaseCard({
  case: caseItem,
  onCaseClick,
  onEditCase,
  onArchiveCase,
  onDeleteCase,
  compact = false,
  className,
}: CaseCardProps) {
  const getDeadlineUrgency = () => {
    if (!caseItem.nextDeadline) return null;
    
    const daysUntil = differenceInDays(new Date(caseItem.nextDeadline.date), new Date());
    
    if (daysUntil < 0) return { level: "overdue", text: "Overdue", color: "text-red-600" };
    if (daysUntil === 0) return { level: "today", text: "Due today", color: "text-red-500" };
    if (daysUntil <= 3) return { level: "urgent", text: `${daysUntil} days left`, color: "text-orange-500" };
    if (daysUntil <= 7) return { level: "soon", text: `${daysUntil} days left`, color: "text-yellow-600" };
    
    return { level: "normal", text: `${daysUntil} days left`, color: "text-muted-foreground" };
  };

  const deadlineUrgency = getDeadlineUrgency();

  const handleCardClick = () => {
    onCaseClick?.(caseItem);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group",
        compact && "p-3",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className={cn("pb-3", compact && "p-0 pb-2")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-primary" />
              <Badge variant="outline" className="text-xs">
                {caseItem.caseNumber}
              </Badge>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getStatusColor(caseItem.status))}
              >
                {caseItem.status}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getPriorityColor(caseItem.priority))}
              >
                {caseItem.priority} priority
              </Badge>
            </div>
            
            <CardTitle className={cn("text-lg font-semibold mb-1", compact && "text-base")}>
              {caseItem.title}
            </CardTitle>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {caseItem.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {caseItem.client.name}
              </span>
              <span>{caseItem.practice_area}</span>
              <span>{format(new Date(caseItem.createdDate), "MMM d, yyyy")}</span>
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
              <DropdownMenuItem onClick={() => onCaseClick?.(caseItem)}>
                <Scale className="mr-2 h-4 w-4" />
                View Case
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditCase?.(caseItem)}>
                <FileText className="mr-2 h-4 w-4" />
                Edit Case
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchiveCase?.(caseItem)}>
                Archive Case
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteCase?.(caseItem)}
              >
                Delete Case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="pt-0 space-y-4">
          {/* Next Deadline */}
          {caseItem.nextDeadline && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <div>
                  <p className="font-medium text-sm">{caseItem.nextDeadline.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(caseItem.nextDeadline.date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              {deadlineUrgency && (
                <div className="flex items-center gap-1">
                  {deadlineUrgency.level === "overdue" && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn("text-xs font-medium", deadlineUrgency.color)}>
                    {deadlineUrgency.text}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Case Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Lawyer:</span>
                <span className="font-medium">{caseItem.assignedLawyer}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Documents:</span>
                <span className="font-medium">{caseItem.documents}</span>
              </div>
              
              {caseItem.courtLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Court:</span>
                  <span className="font-medium">{caseItem.courtLocation}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {caseItem.billingInfo && (
                <>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Billed:</span>
                    <span className="font-medium">
                      ${caseItem.billingInfo.totalBilled.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Hours:</span>
                    <span className="font-medium">{caseItem.billingInfo.hoursWorked}</span>
                  </div>
                </>
              )}
              
              {caseItem.judge && (
                <div className="flex items-center gap-2">
                  <Scale className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Judge:</span>
                  <span className="font-medium">{caseItem.judge}</span>
                </div>
              )}
            </div>
          </div>

          {/* Client Contact Info */}
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm mb-2">Client Contact</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <a href={`mailto:${caseItem.client.email}`} className="text-blue-600 hover:underline">
                  {caseItem.client.email}
                </a>
              </div>
              {caseItem.client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <a href={`tel:${caseItem.client.phone}`} className="text-blue-600 hover:underline">
                    {caseItem.client.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Settlement Information */}
          {caseItem.settlement && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Settlement</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      caseItem.settlement.status === "accepted" ? "bg-green-100 text-green-800" :
                      caseItem.settlement.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    )}
                  >
                    {caseItem.settlement.status}
                  </Badge>
                  <span className="font-medium">
                    ${caseItem.settlement.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Compact case list item for smaller displays
export function CaseListItem({ 
  case: caseItem, 
  onCaseClick 
}: { 
  case: Case, 
  onCaseClick?: (caseItem: Case) => void 
}) {
  return (
    <div 
      className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-accent cursor-pointer"
      onClick={() => onCaseClick?.(caseItem)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {caseItem.caseNumber}
          </Badge>
          <Badge 
            variant="secondary" 
            className={cn("text-xs", getStatusColor(caseItem.status))}
          >
            {caseItem.status}
          </Badge>
        </div>
        <p className="font-medium truncate">{caseItem.title}</p>
        <p className="text-sm text-muted-foreground">{caseItem.client.name}</p>
      </div>
      
      <div className="text-right">
        {caseItem.nextDeadline && (
          <p className="text-xs text-muted-foreground">
            Next: {format(new Date(caseItem.nextDeadline.date), "MMM d")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {caseItem.practice_area}
        </p>
      </div>
    </div>
  );
}