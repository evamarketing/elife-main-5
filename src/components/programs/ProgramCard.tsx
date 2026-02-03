import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Settings, Eye, Megaphone, FileText, Video, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Program } from "@/hooks/usePrograms";
import { format } from "date-fns";

interface ProgramCardProps {
  program: Program;
  isAdmin?: boolean;
}

export function ProgramCard({ program, isAdmin = false }: ProgramCardProps) {
  const hasAnnouncements = program.modules?.some((m) => m.module_type === "announcement");
  const hasRegistration = program.modules?.some((m) => m.module_type === "registration");
  const hasAdvertisement = program.modules?.some((m) => m.module_type === "advertisement");

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge
            variant="secondary"
            style={{
              backgroundColor: program.division?.color || undefined,
              color: program.division?.color ? "white" : undefined,
            }}
          >
            {program.division?.name || "Unknown Division"}
          </Badge>
          <Badge variant={program.is_active ? "default" : "secondary"}>
            {program.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{program.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {program.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {program.description}
          </p>
        )}
        <div className="space-y-2 text-sm">
          {program.start_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(program.start_date), "MMM d, yyyy")}
                {program.end_date && ` - ${format(new Date(program.end_date), "MMM d, yyyy")}`}
              </span>
            </div>
          )}
          {program.panchayath?.name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{program.panchayath.name}</span>
            </div>
          )}
          {program.all_panchayaths && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>All Panchayaths</span>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{program.registration_count || 0} registrations</span>
            </div>
          )}
        </div>

        {/* Module indicators */}
        <div className="flex flex-wrap gap-2 mt-4">
          {hasAnnouncements && (
            <Badge variant="outline" className="gap-1">
              <Megaphone className="h-3 w-3" />
              Announcement
            </Badge>
          )}
          {hasRegistration && (
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              Registration
            </Badge>
          )}
          {hasAdvertisement && (
            <Badge variant="outline" className="gap-1">
              <Video className="h-3 w-3" />
              Ad
            </Badge>
          )}
          {(program as any).verification_enabled && (
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 dark:text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              Verification
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {isAdmin ? (
          <>
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/admin/programs/${program.id}`}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link to={`/program/${program.id}`} target="_blank">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild className="w-full">
            <Link to={`/program/${program.id}`}>View Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
