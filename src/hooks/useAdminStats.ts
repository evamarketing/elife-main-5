import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PanchayathStats {
  id: string;
  name: string;
  registrations: number;
  programs: number;
}

interface ClusterStats {
  id: string;
  name: string;
  members: number;
  panchayath_name: string;
}

interface RecentRegistration {
  id: string;
  program_name: string;
  registrant_name: string;
  created_at: string;
}

interface AdminStats {
  totalPrograms: number;
  totalRegistrations: number;
  activePrograms: number;
  totalMembers: number;
  panchayathStats: PanchayathStats[];
  clusterStats: ClusterStats[];
  recentRegistrations: RecentRegistration[];
  isLoading: boolean;
  error: string | null;
}

export function useAdminStats(): AdminStats {
  const { adminData, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalPrograms: 0,
    totalRegistrations: 0,
    activePrograms: 0,
    totalMembers: 0,
    panchayathStats: [],
    clusterStats: [],
    recentRegistrations: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const divisionId = adminData?.division_id;
        
        if (!divisionId && !isSuperAdmin) {
          setStats(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Fetch programs
        let programsQuery = supabase
          .from("programs")
          .select("id, is_active, panchayath_id, all_panchayaths");
        
        if (!isSuperAdmin && divisionId) {
          programsQuery = programsQuery.eq("division_id", divisionId);
        }
        
        const { data: programs, error: programsError } = await programsQuery;
        if (programsError) throw programsError;

        const programIds = programs?.map(p => p.id) || [];
        const activePrograms = programs?.filter(p => p.is_active).length || 0;

        // Fetch registrations for these programs
        let registrationsCount = 0;
        if (programIds.length > 0) {
          const { count, error: regError } = await supabase
            .from("program_registrations")
            .select("*", { count: "exact", head: true })
            .in("program_id", programIds);
          
          if (regError) throw regError;
          registrationsCount = count || 0;
        }

        // Fetch members
        let membersQuery = supabase
          .from("members")
          .select("*", { count: "exact", head: true });
        
        if (!isSuperAdmin && divisionId) {
          membersQuery = membersQuery.eq("division_id", divisionId);
        }
        
        const { count: membersCount, error: membersError } = await membersQuery;
        if (membersError) throw membersError;

        // Fetch panchayath-wise stats
        const { data: panchayaths, error: panchError } = await supabase
          .from("panchayaths")
          .select("id, name")
          .eq("is_active", true);
        
        if (panchError) throw panchError;

        const panchayathStats: PanchayathStats[] = [];
        for (const panchayath of panchayaths || []) {
          // Count programs for this panchayath
          const panchayathPrograms = programs?.filter(
            p => p.panchayath_id === panchayath.id || p.all_panchayaths
          ).length || 0;

          // Count registrations for panchayath programs
          const panchayathProgramIds = programs?.filter(
            p => p.panchayath_id === panchayath.id || p.all_panchayaths
          ).map(p => p.id) || [];

          let panchayathRegs = 0;
          if (panchayathProgramIds.length > 0) {
            const { count } = await supabase
              .from("program_registrations")
              .select("*", { count: "exact", head: true })
              .in("program_id", panchayathProgramIds);
            panchayathRegs = count || 0;
          }

          if (panchayathPrograms > 0 || panchayathRegs > 0) {
            panchayathStats.push({
              id: panchayath.id,
              name: panchayath.name,
              programs: panchayathPrograms,
              registrations: panchayathRegs,
            });
          }
        }

        // Fetch cluster-wise stats
        const { data: clusters, error: clusterError } = await supabase
          .from("clusters")
          .select(`
            id,
            name,
            panchayath:panchayaths(name)
          `)
          .eq("is_active", true);
        
        if (clusterError) throw clusterError;

        const clusterStats: ClusterStats[] = [];
        for (const cluster of clusters || []) {
          let memberQuery = supabase
            .from("members")
            .select("*", { count: "exact", head: true })
            .eq("cluster_id", cluster.id);
          
          if (!isSuperAdmin && divisionId) {
            memberQuery = memberQuery.eq("division_id", divisionId);
          }

          const { count } = await memberQuery;
          
          if ((count || 0) > 0) {
            clusterStats.push({
              id: cluster.id,
              name: cluster.name,
              members: count || 0,
              panchayath_name: (cluster.panchayath as any)?.name || "Unknown",
            });
          }
        }

        // Fetch recent registrations for the admin's programs
        const recentRegistrations: RecentRegistration[] = [];
        if (programIds.length > 0) {
          const { data: recentRegs } = await supabase
            .from("program_registrations")
            .select("id, created_at, answers, program:programs(name)")
            .in("program_id", programIds)
            .order("created_at", { ascending: false })
            .limit(10);
          
          for (const reg of recentRegs || []) {
            const answers = reg.answers as Record<string, any> || {};
            const registrantName = answers.full_name || answers.name || "Unknown";
            recentRegistrations.push({
              id: reg.id,
              program_name: (reg.program as any)?.name || "Unknown Program",
              registrant_name: registrantName,
              created_at: reg.created_at,
            });
          }
        }

        setStats({
          totalPrograms: programs?.length || 0,
          totalRegistrations: registrationsCount,
          activePrograms,
          totalMembers: membersCount || 0,
          panchayathStats: panchayathStats.sort((a, b) => b.registrations - a.registrations),
          clusterStats: clusterStats.sort((a, b) => b.members - a.members),
          recentRegistrations,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        console.error("Error fetching admin stats:", err);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: err.message,
        }));
      }
    };

    fetchStats();
  }, [adminData, isSuperAdmin]);

  return stats;
}
