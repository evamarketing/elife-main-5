import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Program {
  id: string;
  name: string;
}

interface Registration {
  id: string;
  program_id: string;
  answers: Record<string, any>;
  created_at: string;
}

interface RegistrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterPanchayathId?: string;
  filterPanchayathName?: string;
}

export function RegistrationsDialog({
  open,
  onOpenChange,
  filterPanchayathId,
  filterPanchayathName,
}: RegistrationsDialogProps) {
  const { adminData, adminToken } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [programsLoading, setProgramsLoading] = useState(true);

  // Fetch programs for the admin's division
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!open || !adminData?.division_id) return;

      setProgramsLoading(true);
      const { data } = await supabase
        .from("programs")
        .select("id, name")
        .eq("division_id", adminData.division_id)
        .eq("is_active", true)
        .order("name");

      setPrograms(data || []);
      setProgramsLoading(false);
    };

    fetchPrograms();
  }, [open, adminData?.division_id]);

  // Fetch registrations when program or filter changes
  const fetchRegistrations = useCallback(async () => {
    if (!open || !adminToken) return;

    setIsLoading(true);
    try {
      let allRegistrations: Registration[] = [];
      const programsToFetch = selectedProgramId === "all" 
        ? programs.map(p => p.id)
        : [selectedProgramId];

      // Fetch registrations for each program using the edge function
      for (const programId of programsToFetch) {
        const response = await fetch(
          `https://qnucqwniloioxsowdqzj.supabase.co/functions/v1/admin-registrations?program_id=${programId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-admin-token": adminToken,
            },
          }
        );

        if (response.ok) {
          const { registrations: regs } = await response.json();
          allRegistrations = [...allRegistrations, ...regs];
        }
      }

      // Filter by panchayath if specified
      if (filterPanchayathId) {
        allRegistrations = allRegistrations.filter(
          (reg) => reg.answers?._fixed?.panchayath_id === filterPanchayathId
        );
      }

      // Sort by created_at descending
      allRegistrations.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRegistrations(allRegistrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [open, adminToken, selectedProgramId, programs, filterPanchayathId]);

  useEffect(() => {
    if (open && programs.length > 0) {
      fetchRegistrations();
    }
  }, [open, programs, selectedProgramId, fetchRegistrations]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedProgramId("all");
      setRegistrations([]);
    }
  }, [open]);

  const getProgramName = (programId: string) => {
    return programs.find((p) => p.id === programId)?.name || "Unknown Program";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Registrations
            {filterPanchayathName && (
              <Badge variant="secondary" className="ml-2">
                <MapPin className="h-3 w-3 mr-1" />
                {filterPanchayathName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {filterPanchayathName
              ? `Viewing registrations from ${filterPanchayathName}`
              : "View all registrations across programs"}
          </DialogDescription>
        </DialogHeader>

        {/* Program Filter */}
        <div className="flex items-center gap-2 py-2">
          <span className="text-sm text-muted-foreground">Program:</span>
          <Select
            value={selectedProgramId}
            onValueChange={setSelectedProgramId}
            disabled={programsLoading}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isLoading && (
            <Badge variant="outline" className="ml-2">
              {registrations.length} registrations
            </Badge>
          )}
        </div>

        {/* Registrations Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          {isLoading || programsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No registrations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Panchayath</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {reg.answers?._fixed?.name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {reg.answers?._fixed?.mobile || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {reg.answers?._fixed?.panchayath_name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{reg.answers?._fixed?.ward || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getProgramName(reg.program_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(reg.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
